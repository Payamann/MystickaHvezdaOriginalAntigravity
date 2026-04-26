import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import comment_bot
import comment_manager


def _comment(comment_id: str, message: str, status: str = "new") -> dict:
    return {
        "id": comment_id,
        "platform": "facebook",
        "post_id": "post-1",
        "thread_id": comment_id,
        "post_message": "Tarot a dnešní energie",
        "from_name": "User",
        "from_id": "user-1",
        "message": message,
        "created_time": "2026-04-25T10:00:00+0000",
        "fetched_at": "2026-04-25T10:01:00",
        "status": status,
        "suggested_reply": "starý návrh",
        "actual_reply": None,
        "sentiment": "positive",
        "priority": 5,
        "needs_reply": True,
        "should_hide": False,
        "reply_id": None,
    }


def test_sync_upserts_every_fetched_comment(monkeypatch):
    db = {
        "comments": {
            "c1": _comment("c1", "Děkuji za příspěvek"),
        },
        "stats": {"total_fetched": 0},
    }
    fetched = [
        _comment("c1", "Mám se špatně"),
        _comment("c2", "Jak funguje tarot výklad?"),
    ]

    monkeypatch.setattr(comment_manager, "_load_db", lambda: db)
    monkeypatch.setattr(comment_manager, "_save_db", lambda updated: db.update(updated))
    monkeypatch.setattr(comment_manager, "fetch_all_comments", lambda since_hours: fetched)

    stats = comment_manager.sync_comments(since_hours=168)

    assert stats["fetched"] == 2
    assert stats["added"] == 1
    assert stats["updated"] == 1
    assert db["comments"]["c1"]["message"] == "Mám se špatně"
    assert db["comments"]["c1"]["sentiment"] == "emotional"
    assert db["comments"]["c1"]["suggested_reply"] is None
    assert db["comments"]["c2"]["sentiment"] == "question"


def test_sync_preserves_replied_status_when_refreshing_existing_comment(monkeypatch):
    replied = _comment("c1", "Původní text", status="replied")
    replied["actual_reply"] = "Už jsme odpověděli."
    db = {"comments": {"c1": replied}, "stats": {"total_fetched": 0}}

    monkeypatch.setattr(comment_manager, "_load_db", lambda: db)
    monkeypatch.setattr(comment_manager, "_save_db", lambda updated: db.update(updated))
    monkeypatch.setattr(comment_manager, "fetch_all_comments", lambda since_hours: [
        _comment("c1", "Upravený text po odpovědi")
    ])

    stats = comment_manager.sync_comments(since_hours=168)

    assert stats["updated"] == 1
    assert db["comments"]["c1"]["message"] == "Upravený text po odpovědi"
    assert db["comments"]["c1"]["status"] == "replied"
    assert db["comments"]["c1"]["actual_reply"] == "Už jsme odpověděli."


def test_facebook_post_fetch_is_not_limited_by_post_age(monkeypatch):
    calls = []

    class FakeResponse:
        status_code = 200
        text = "{}"

        def __init__(self, data):
            self._data = data

        def json(self):
            return self._data

    def fake_get(url, params=None, timeout=None):
        calls.append({"url": url, "params": params or {}})
        return FakeResponse({"data": []})

    monkeypatch.setattr(comment_manager.config, "META_ACCESS_TOKEN", "token")
    monkeypatch.setattr(comment_manager.config, "META_PAGE_ID", "page-1")
    monkeypatch.setattr(comment_manager.requests, "get", fake_get)

    comment_manager.fetch_facebook_comments(since_hours=168)

    assert calls
    assert calls[0]["url"].endswith("/page-1/posts")
    assert "since" not in calls[0]["params"]


def test_run_once_syncs_before_pending_comments(monkeypatch):
    events = []

    monkeypatch.setattr(comment_bot.config, "META_ACCESS_TOKEN", "token")
    monkeypatch.setattr(comment_bot, "sync_comments", lambda since_hours: events.append("sync") or {
        "fetched": 0,
        "added": 0,
        "updated": 0,
        "skipped": 0,
        "total_in_db": 0,
    })
    monkeypatch.setattr(comment_bot, "get_comments_to_hide", lambda: events.append("hide") or [])

    def fake_pending(*args, **kwargs):
        events.append("pending")
        return []

    monkeypatch.setattr(comment_bot, "get_pending_comments", fake_pending)

    comment_bot.run_once("dry-run", since_hours=1)

    assert events == ["sync", "hide", "pending"]
