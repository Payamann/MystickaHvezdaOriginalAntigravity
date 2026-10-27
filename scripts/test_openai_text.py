import unittest
from unittest.mock import Mock, patch

from openai_text import call_openai_text


class OpenAITextTests(unittest.TestCase):
    @patch("openai_text.requests.post")
    def test_completed_response_and_openai_only_request(self, post):
        post.return_value = Mock(ok=True)
        post.return_value.json.return_value = {"status": "completed", "output": [
            {"type": "reasoning", "summary": []},
            {"type": "message", "role": "assistant", "status": "completed", "content": [{"type": "output_text", "text": " Výklad "}]},
        ]}
        self.assertEqual(call_openai_text("test-key", "system", "user", max_tokens=100), "Výklad")
        args, kwargs = post.call_args
        self.assertEqual(args[0], "https://api.openai.com/v1/responses")
        self.assertEqual(kwargs["json"]["model"], "gpt-6-luna")
        self.assertEqual(kwargs["json"]["reasoning"], {"effort": "none"})
        self.assertFalse(kwargs["json"]["store"])

    @patch("openai_text.requests.post")
    def test_invalid_model_and_missing_key_never_call_provider(self, post):
        for key, model in [("test-key", "other-model"), ("", "gpt-6-luna")]:
            with self.assertRaises(ValueError):
                call_openai_text(key, "system", "user", max_tokens=100, model=model)
        post.assert_not_called()

    @patch("openai_text.requests.post")
    def test_incomplete_refusal_and_empty_outputs_fail_closed(self, post):
        post.return_value = Mock(ok=True)
        for body in [
            {"status": "incomplete", "output": []},
            {"status": "completed", "output": []},
            {"status": "completed", "output": [{"type": "message", "content": [
                {"type": "refusal", "refusal": "private data"}]}]},
        ]:
            post.return_value.json.return_value = body
            with self.assertRaises(RuntimeError):
                call_openai_text("test-key", "system", "user", max_tokens=100)

    @patch("openai_text.requests.post")
    def test_tool_or_partial_message_does_not_count_as_completed_text(self, post):
        post.return_value = Mock(ok=True)
        for item in [
            {"type": "function_call", "arguments": "{}"},
            {"type": "message", "role": "assistant", "status": "incomplete", "content": [{"type": "output_text", "text": "partial"}]},
        ]:
            post.return_value.json.return_value = {"status": "completed", "output": [item]}
            with self.assertRaises(RuntimeError):
                call_openai_text("test-key", "system", "user", max_tokens=100)

    @patch("openai_text.requests.post")
    def test_http_errors_do_not_expose_response_body(self, post):
        post.return_value = Mock(ok=False, status_code=401, text="PRIVATE_PROMPT")
        with self.assertRaisesRegex(RuntimeError, r"^OpenAI request failed \(401\)$"):
            call_openai_text("test-key", "system", "user", max_tokens=100)


if __name__ == "__main__":
    unittest.main()
