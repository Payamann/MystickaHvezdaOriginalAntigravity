import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import comment_bot


def _comment(message: str, sentiment: str) -> dict:
    return {
        "id": "c-template",
        "platform": "facebook",
        "post_id": "post-1",
        "from_name": "User",
        "from_id": "user-1",
        "message": message,
        "post_message": "Tarot a dnešní energie",
        "status": "new",
        "sentiment": sentiment,
        "priority": 5,
        "needs_reply": True,
        "should_hide": False,
    }


def test_template_reply_path_does_not_call_ai(monkeypatch):
    called = {"ai": 0}

    def fail_ai(*args, **kwargs):
        called["ai"] += 1
        raise AssertionError("AI should not be called for template route")

    monkeypatch.setattr(comment_bot, "generate_comment_reply", fail_ai)
    monkeypatch.setattr(comment_bot, "get_comment_thread_memory", lambda cid: {"recent_replies": []})
    monkeypatch.setattr(comment_bot, "save_comment_reply_metadata", lambda *args, **kwargs: None)
    monkeypatch.setattr(comment_bot, "record_comment_reply_usage", lambda *args, **kwargs: None)

    reply = comment_bot.build_reply_for_comment(_comment("Děkuji, krásné", "positive"), mode="dry-run")

    assert reply
    assert called["ai"] == 0


def test_low_signal_comment_is_ignored_without_ai(monkeypatch):
    ignored = {}
    monkeypatch.setattr(comment_bot, "generate_comment_reply", lambda *args, **kwargs: "nemá se volat")
    monkeypatch.setattr(comment_bot, "get_comment_thread_memory", lambda cid: {"recent_replies": []})
    monkeypatch.setattr(comment_bot, "mark_comment_ignored", lambda cid, reason: ignored.update({"cid": cid, "reason": reason}))

    reply = comment_bot.build_reply_for_comment(_comment("ok", "low_signal"), mode="auto")

    assert reply is None
    assert ignored["cid"] == "c-template"
    assert ignored["reason"].startswith("reply_strategy:")


def test_process_comment_reuses_preclaim_token(monkeypatch):
    seen = {}
    comment = _comment("Děkuji", "positive")
    comment["suggested_reply"] = "Díky za milou reakci."
    comment["_claim_token"] = "token-1"

    monkeypatch.setattr(comment_bot, "claim_comment_for_reply", lambda cid: (_ for _ in ()).throw(AssertionError("already claimed")))
    monkeypatch.setattr(comment_bot, "_human_delay", lambda mode: None)
    monkeypatch.setattr(comment_bot, "_increment_today_count", lambda: 1)

    def fake_reply(comment_id, reply, claim_token=None):
        seen["comment_id"] = comment_id
        seen["claim_token"] = claim_token
        return {"success": True, "reply_id": "reply-1"}

    monkeypatch.setattr(comment_bot, "_reply_to_comment", fake_reply)

    assert comment_bot.process_comment(comment, mode="auto") is True
    assert seen == {"comment_id": "c-template", "claim_token": "token-1"}


def test_process_comment_stops_on_meta_rate_limit(monkeypatch):
    comment = _comment("Děkuji", "positive")
    comment["suggested_reply"] = "Díky za milou reakci."
    comment["_claim_token"] = "token-1"

    monkeypatch.setattr(comment_bot, "_human_delay", lambda mode: None)
    monkeypatch.setattr(comment_bot, "release_comment_claim", lambda *args, **kwargs: None)
    monkeypatch.setattr(comment_bot, "_reply_to_comment", lambda *args, **kwargs: {
        "success": False,
        "error": "You are using this feature too fast",
        "rate_limited": True,
    })

    with pytest.raises(comment_bot.MetaRateLimitStop):
        comment_bot.process_comment(comment, mode="auto")


def test_review_without_terminal_releases_claim_without_reply(monkeypatch):
    comment = _comment("Děkuji", "positive")
    comment["suggested_reply"] = "Díky za milou reakci."
    comment["_claim_token"] = "claim-1"
    released = []

    monkeypatch.setattr(comment_bot.sys, "stdin", type("NoTerminal", (), {"isatty": lambda self: False})())
    monkeypatch.setattr(comment_bot, "release_comment_claim", lambda *args: released.append(args))
    monkeypatch.setattr(comment_bot, "_reply_to_comment", lambda *args, **kwargs: pytest.fail("reply sent"))

    assert comment_bot.process_comment(comment, mode="review") is False
    assert released == [("c-template", "claim-1", "review requires interactive confirmation")]


def test_review_timeout_does_not_reply(monkeypatch):
    comment = _comment("Děkuji", "positive")
    comment["suggested_reply"] = "Díky za milou reakci."
    comment["_claim_token"] = "claim-1"
    released = []

    monkeypatch.setattr(comment_bot.sys, "stdin", type("Terminal", (), {"isatty": lambda self: True})())
    monkeypatch.setattr(comment_bot, "_read_review_choice", lambda timeout: (None, True))
    monkeypatch.setattr(comment_bot, "release_comment_claim", lambda *args: released.append(args))
    monkeypatch.setattr(comment_bot, "_reply_to_comment", lambda *args, **kwargs: pytest.fail("reply sent"))

    assert comment_bot.process_comment(comment, mode="review") is False
    assert released == [("c-template", "claim-1", "review confirmation timeout")]


def test_review_does_not_hide_flagged_comment(monkeypatch):
    comment = _comment("Spam", "spam")
    comment["should_hide"] = True
    monkeypatch.setattr(comment_bot, "hide_comment", lambda *args: pytest.fail("comment hidden"))

    assert comment_bot.process_comment(comment, mode="review") is False


def test_review_does_not_offer_reply_that_failed_quality_gate(monkeypatch):
    comment = _comment("Jak funguje tarot?", "question")
    comment["suggested_reply"] = "Jako AI doporučuji klikni na https://example.com"
    monkeypatch.setattr(comment_bot, "get_comment_thread_memory", lambda cid: {"recent_replies": []})
    monkeypatch.setattr(comment_bot, "_save_quality_result", lambda *args, **kwargs: None)
    monkeypatch.setattr(comment_bot, "mark_comment_ignored", lambda *args: pytest.fail("comment ignored"))

    assert comment_bot.build_reply_for_comment(comment, mode="review") is None
