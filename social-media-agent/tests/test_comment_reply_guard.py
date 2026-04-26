"""
Tests that one Meta comment ID receives at most one bot reply.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import comment_manager
from comment_manager import (
    _reply_to_comment,
    claim_comment_for_reply,
    get_pending_comments,
)


def _comment(comment_id: str, status: str = "new", from_id: str = "user-1") -> dict:
    return {
        "id": comment_id,
        "platform": "facebook",
        "post_id": "post-1",
        "from_name": "User",
        "from_id": from_id,
        "message": "Mám se špatně",
        "created_time": "2026-04-25T10:00:00+0000",
        "status": status,
        "sentiment": "emotional",
        "priority": 9,
        "needs_reply": True,
        "should_hide": False,
    }


def test_claim_blocks_second_claim_for_same_comment(monkeypatch):
    db = {"comments": {"c1": _comment("c1")}, "stats": {}}
    monkeypatch.setattr(comment_manager, "_load_db", lambda: db)
    monkeypatch.setattr(comment_manager, "_save_db", lambda updated: db.update(updated))

    first_token = claim_comment_for_reply("c1")
    second_token = claim_comment_for_reply("c1")

    assert first_token
    assert second_token is None
    assert db["comments"]["c1"]["status"] == "processing"


def test_reply_marks_comment_replied_and_blocks_second_reply(monkeypatch):
    db = {"comments": {"c1": _comment("c1")}, "stats": {"total_replied": 0}}
    monkeypatch.setattr(comment_manager, "_load_db", lambda: db)
    monkeypatch.setattr(comment_manager, "_save_db", lambda updated: db.update(updated))
    monkeypatch.setattr(comment_manager, "post_reply_facebook", lambda comment_id, text: {
        "success": True,
        "reply_id": "reply-1",
    })

    token = claim_comment_for_reply("c1")
    first = _reply_to_comment("c1", "Držím ti prostor.", claim_token=token)
    second = _reply_to_comment("c1", "Druhá odpověď", claim_token=token)

    assert first["success"] is True
    assert db["comments"]["c1"]["status"] == "replied"
    assert db["comments"]["c1"]["reply_id"] == "reply-1"
    assert second["success"] is False
    assert second["already_replied"] is True


def test_wrong_claim_token_does_not_send(monkeypatch):
    db = {"comments": {"c1": _comment("c1")}, "stats": {"total_replied": 0}}
    sent = {"count": 0}
    monkeypatch.setattr(comment_manager, "_load_db", lambda: db)
    monkeypatch.setattr(comment_manager, "_save_db", lambda updated: db.update(updated))

    def fake_send(comment_id, text):
        sent["count"] += 1
        return {"success": True, "reply_id": "reply-1"}

    monkeypatch.setattr(comment_manager, "post_reply_facebook", fake_send)

    claim_comment_for_reply("c1")
    result = _reply_to_comment("c1", "Text", claim_token="wrong")

    assert result["success"] is False
    assert result["in_progress"] is True
    assert sent["count"] == 0


def test_new_followup_from_same_user_stays_pending(monkeypatch):
    db = {
        "comments": {
            "c1": _comment("c1", status="replied", from_id="user-1"),
            "c2": _comment("c2", status="new", from_id="user-1"),
        },
        "stats": {},
    }
    monkeypatch.setattr(comment_manager, "_load_db", lambda: db)

    pending = get_pending_comments(min_priority=3)

    assert [comment["id"] for comment in pending] == ["c2"]
