"""Mocked image transport checks; imports never load real credentials or log files."""
import base64
from io import BytesIO
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import Mock, patch

from PIL import Image


def png_payload(size):
    buffer = BytesIO()
    Image.new("RGB", size, "#050510").save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


class OpenAIImageTests(unittest.TestCase):
    def setUp(self):
        temp_root = Path(__file__).resolve().parents[2] / ".tmp"
        temp_root.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temp_root, prefix="openai-image-test-")
        self.addCleanup(self.temp.cleanup)
        self.config = SimpleNamespace(
            OPENAI_API_KEY="test-openai-key", IMAGE_MODEL="gpt-image-2.5-flare",
            IMAGES_DIR=Path(self.temp.name) / "images",
        )
        spec = importlib.util.spec_from_file_location(
            "mocked_image_generator", Path(__file__).parents[1] / "generators" / "image_generator.py"
        )
        self.module = importlib.util.module_from_spec(spec)
        with patch.dict("sys.modules", {
            "config": self.config, "logger": SimpleNamespace(get_logger=lambda _: Mock())
        }):
            spec.loader.exec_module(self.module)
        self.client = Mock()
        self.constructor = patch.object(self.module, "OpenAI", return_value=self.client).start()
        self.addCleanup(patch.stopall)

    def response(self, payload):
        return SimpleNamespace(data=[SimpleNamespace(b64_json=payload)])

    def test_each_format_requests_one_medium_png_and_preserves_dimensions(self):
        for post_type, size in self.module.IMAGE_SIZES.items():
            with self.subTest(post_type=post_type):
                dimensions = tuple(map(int, size.split("x")))
                self.client.images.generate.return_value = self.response(png_payload(dimensions))
                output = self.module.generate_image("A violet window", post_type=post_type, filename=post_type)
                self.assertEqual(output.parent, self.config.IMAGES_DIR.resolve())
                with Image.open(output) as image:
                    self.assertEqual(image.size, dimensions)
                self.client.images.generate.assert_called_with(
                    model="gpt-image-2.5-flare", prompt=unittest.mock.ANY,
                    size=size, quality="medium", n=1, output_format="png",
                )
                self.assertIn("A violet window", self.client.images.generate.call_args.kwargs["prompt"])
        self.constructor.assert_called_once_with(
            api_key="test-openai-key", base_url="https://api.openai.com/v1", max_retries=0, timeout=90
        )

    def test_paths_are_rejected_before_any_api_call(self):
        for filename in ["../escape", "/absolute", "nested/file", r"nested\file", "..", "file.png"]:
            with self.subTest(filename=filename), self.assertRaises(ValueError):
                self.module.generate_image("prompt", filename=filename)
        self.constructor.assert_not_called()
        self.assertFalse(self.config.IMAGES_DIR.exists())

    def test_symlink_output_escape_is_rejected_before_api_call(self):
        # Resolve guard also handles an existing output symlink.
        with patch.object(Path, "resolve", side_effect=[self.config.IMAGES_DIR, Path(self.temp.name) / "escape.png"]):
            with self.assertRaises(ValueError):
                self.module.generate_image("prompt", filename="existing")
        self.constructor.assert_not_called()

    def test_missing_key_and_other_model_fail_before_api(self):
        self.config.OPENAI_API_KEY = ""
        with self.assertRaises(ValueError):
            self.module.generate_image("prompt", filename="missing")
        self.config.OPENAI_API_KEY = "test-openai-key"
        self.config.IMAGE_MODEL = "other-provider"
        with self.assertRaises(ValueError):
            self.module.generate_image("prompt", filename="other")
        self.constructor.assert_not_called()

    def test_provider_failure_never_retries_or_writes_placeholder(self):
        self.client.images.generate.side_effect = RuntimeError("PRIVATE_PROMPT")
        with self.assertRaisesRegex(RuntimeError, "^Grafiku se nepodařilo vygenerovat přes OpenAI.$"):
            self.module.generate_image("PRIVATE_PROMPT", filename="failed")
        self.client.images.generate.assert_called_once()
        self.assertFalse(self.config.IMAGES_DIR.exists())

    def test_empty_multiple_url_corrupt_and_wrong_size_results_fail_closed(self):
        cases = [
            SimpleNamespace(data=[]),
            SimpleNamespace(data=[SimpleNamespace(), SimpleNamespace()]),
            SimpleNamespace(data=[SimpleNamespace(url="https://example.invalid/image", b64_json=None)]),
            self.response("not base64"),
            self.response(base64.b64encode(b"not a PNG").decode()),
            self.response(png_payload((16, 16))),
        ]
        for result in cases:
            with self.subTest(result=result):
                self.client.images.generate.return_value = result
                with self.assertRaises(RuntimeError):
                    self.module.generate_image("prompt", filename="invalid")
                self.assertFalse(self.config.IMAGES_DIR.exists())


if __name__ == "__main__":
    unittest.main()
