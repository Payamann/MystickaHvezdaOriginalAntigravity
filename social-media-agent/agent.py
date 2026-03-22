"""
🔮 Mystická Hvězda — Social Media Agent v2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Použití:
  python agent.py generate              Interaktivní generování (výběr tématu, typů, variací)
  python agent.py generate --auto       Automaticky vygeneruje post (vhodné pro denní rutinu)
  python agent.py blog [--all]          Blog promo post (--all ukáže výběr z posledních 10 článků)
  python agent.py plan                  Týdenní plán s lunárním kontextem
  python agent.py story TÉMA            Série Instagram Stories (5-7 slidů)
  python agent.py carousel TÉMA         Karusel post obsah (7 slidů)
  python agent.py list                  Přehled uložených postů
  python agent.py reply "komentář"      Manuální odpověď na komentář (bez Meta API)
  python agent.py comments              Správa komentářů z FB + IG (vyžaduje Meta API)
  python agent.py comments --sync       Načte nové komentáře a vygeneruje odpovědi
  python agent.py astro                 Dnešní astrologický kontext
"""
import argparse
import sys
import os
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt, Confirm, IntPrompt
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.columns import Columns
from rich.text import Text
from rich import box

import config
from utils import slugify
from logger import get_logger

log = get_logger(__name__)
from generators.text_generator import (
    generate_post, generate_comment_reply,
    generate_weekly_content_plan, generate_story_sequence, generate_carousel,
)
from generators.image_generator import generate_image
from generators.lunar_context import get_full_astrological_context
from generators.content_memory import get_variety_context, record_post
from blog_reader import get_article_for_promo, format_article_for_post, load_blog_articles
from post_saver import save_post, load_all_posts, mark_post_approved
from comment_manager import (
    sync_comments, get_pending_comments, reply_to_comment,
    hide_comment, get_stats, analyze_comment_sentiment,
)
from quality_gate import validate_post, print_quality_report

console = Console()


def print_banner():
    astro = None
    try:
        astro = get_full_astrological_context()
    except Exception as e:
        log.debug("Banner astro kontext nedostupný: %s", e)

    moon_str = f"  {astro['moon']['emoji']} {astro['moon']['phase_cs']}  {astro['sun']['symbol']} {astro['sun']['sign_cs']}" if astro else ""
    console.print(Panel.fit(
        f"[bold purple]🔮 Mystická Hvězda[/bold purple]  [dim]Social Media Agent v2[/dim]{moon_str}",
        border_style="purple"
    ))
    console.print()


# ══════════════════════════════════════════════════
# CMD: GENERATE
# ══════════════════════════════════════════════════

def cmd_generate(auto: bool = False, platform: str = "instagram", variations: int = 1):
    print_banner()

    if auto:
        import random
        # Smart auto: vyhni se nedávno použitým tématům
        variety = get_variety_context()
        recent = variety.get("recent_topics", [])
        available_topics = [t for t in config.CONTENT_THEMES if t not in recent]
        if not available_topics:
            available_topics = config.CONTENT_THEMES

        topic = random.choice(available_topics)
        recent_types = variety.get("recent_post_types", [])
        available_types = [t for t in config.POST_TYPES if t not in recent_types]
        if not available_types:
            available_types = list(config.POST_TYPES.keys())
        post_type = random.choice(available_types)

        console.print(f"[dim]🤖 Auto mód: [cyan]{topic}[/cyan] / [yellow]{post_type}[/yellow][/dim]\n")
    else:
        # Zobraz astro kontext
        try:
            astro = get_full_astrological_context()
            console.print(Panel(
                f"{astro['moon']['emoji']} [bold]{astro['moon']['phase_cs']}[/bold] — {astro['moon']['energy_type']}\n"
                f"{astro['sun']['symbol']} Slunce v [bold]{astro['sun']['sign_cs']}[/bold] — {astro['sun']['themes']}\n"
                f"🔢 Universální den [bold]{astro['universal_day']}[/bold]: {astro['universal_day_meaning']}",
                title="Dnešní energie",
                border_style="dim purple",
            ))
            console.print()
        except Exception as e:
            log.debug("Astro kontext pro generate nedostupný: %s", e)

        # Výběr tématu
        console.print("[bold]📋 Dostupná témata:[/bold]")
        for i, theme in enumerate(config.CONTENT_THEMES, 1):
            console.print(f"  [dim]{i:2}.[/dim] {theme}")

        topic_num = Prompt.ask("\nVyber číslo tématu", default="1")
        try:
            topic = config.CONTENT_THEMES[int(topic_num) - 1]
        except (ValueError, IndexError):
            topic = config.CONTENT_THEMES[0]

        # Výběr typu
        console.print("\n[bold]🎭 Typ postu:[/bold]")
        post_types = list(config.POST_TYPES.keys())
        for i, (pt, desc) in enumerate(config.POST_TYPES.items(), 1):
            console.print(f"  [dim]{i:2}.[/dim] [yellow]{pt}[/yellow] — [dim]{desc}[/dim]")

        type_num = Prompt.ask("\nVyber typ postu", default="1")
        try:
            post_type = post_types[int(type_num) - 1]
        except (ValueError, IndexError):
            post_type = "educational"

        platform = Prompt.ask("Platforma", choices=["instagram", "facebook"], default="instagram")
        variations = IntPrompt.ask("Počet variací captionů (1-3)", default=1)
        variations = max(1, min(3, variations))

    # === GENEROVÁNÍ ===
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as p:
        p.add_task(f"✨ Gemini Flash generuje {variations}x caption pro [cyan]{topic}[/cyan]...", total=None)
        post_data = generate_post(
            post_type=post_type,
            topic=topic,
            platform=platform,
            use_astro_context=True,
            variations=variations,
        )

    # Zobrazení výsledku
    if variations > 1 and "variations" in post_data:
        console.print(f"\n[bold green]✓ Vygenerovány {len(post_data['variations'])} varianty![/bold green]\n")
        for i, var in enumerate(post_data["variations"], 1):
            console.print(Panel(
                var.get("caption", ""),
                title=f"[yellow]Varianta {i}[/yellow] — [dim]{var.get('hook_formula', '')}[/dim]",
                border_style="cyan" if i == post_data.get("recommended_variation", 0) + 1 else "dim",
            ))

        choice = IntPrompt.ask(f"\nKterou variantu použít? (1-{len(post_data['variations'])})",
                               default=post_data.get("recommended_variation", 0) + 1)
        selected = post_data["variations"][choice - 1]
        post_data["caption"] = selected["caption"]
        post_data["hook_formula"] = selected.get("hook_formula", "")
    else:
        caption = post_data.get("caption", "")
        hook = post_data.get("hook_formula", "")
        console.print(Panel(
            f"[dim]Hook: {hook}[/dim]\n\n{caption}\n\n[purple]{' '.join(post_data.get('hashtags', []))}[/purple]",
            title=f"📝 {topic.upper()} / {post_type}",
            border_style="cyan",
        ))

    # === OBRÁZEK ===
    generate_img = Confirm.ask("\n🎨 Vygenerovat obrázek (Imagen 3)?", default=True) if not auto else True
    image_path = None
    if generate_img:
        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as p:
            p.add_task("🖼️  Imagen 3 generuje obrázek...", total=None)
            try:
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                image_path = generate_image(
                    prompt=post_data.get("image_prompt", "mystical atmosphere"),
                    platform=platform,
                    post_type="square" if platform == "instagram" else "landscape",
                    filename=f"post_{ts}",
                )
                console.print(f"[green]✓ Obrázek: {image_path.name}[/green]")
            except Exception as e:
                console.print(f"[yellow]⚠️  Imagen: {e}[/yellow]")

    # === QUALITY GATE ===
    console.print("\n[bold cyan]═══ QUALITY GATE ═══[/bold cyan]")

    # AI review: v auto módu zapnout, v interaktivním se zeptáme
    use_ai = True if auto else Confirm.ask(
        "🔍 Spustit AI kontrolu kvality? (doporučeno)", default=True
    )

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as p:
        if use_ai:
            p.add_task("🔍  Quality Gate: pravidla + AI review...", total=None)
        else:
            p.add_task("🔍  Quality Gate: kontrola pravidel...", total=None)

        # Přidej topic a post_type do post_data pro AI review
        post_data_for_review = {**post_data, "topic": topic, "post_type": post_type}
        qg_result = validate_post(
            post_data=post_data_for_review,
            platform=platform,
            image_path=image_path,
            run_ai_review=use_ai,
        )

    print_quality_report(qg_result)

    # Rozhodnutí
    if not qg_result["approved"]:
        console.print("\n[bold red]⚠️  Quality Gate: post NESCHVÁLEN[/bold red]")
        action = Prompt.ask(
            "Co chceš udělat?",
            choices=["save", "regenerate", "skip"],
            default="save",
        )
        if action == "skip":
            console.print("[dim]Post přeskočen.[/dim]")
            return None
        elif action == "regenerate":
            # Použij AI návrh pokud existuje
            ai = qg_result.get("ai_review", {})
            rewritten = ai.get("rewritten_caption") if ai else None
            if rewritten:
                console.print(Panel(rewritten, title="AI Vylepšený caption", border_style="magenta"))
                use_rewritten = Confirm.ask("Použít AI vylepšený caption?", default=True)
                if use_rewritten:
                    post_data["caption"] = rewritten
            else:
                console.print("[yellow]Spusť generování znovu s jiným nastavením.[/yellow]")
                return None
        # action == "save" → uloží i přes varování

    # === ULOŽENÍ ===
    # Přidej QG skóre do post záznamu
    post_data["quality_score"] = qg_result["score"]
    post_data["quality_verdict"] = qg_result["summary"]

    json_path = save_post(post_data, image_path, platform, topic, post_type)
    html_path = str(json_path).replace('.json', '.html')

    console.print(f"\n[bold green]✓ Post uložen jako DRAFT[/bold green]")
    console.print(f"  Kvalita: [cyan]{qg_result['score']}/10[/cyan] | {qg_result['summary']}")
    console.print(f"[dim]  Otevři v prohlížeči: {html_path}[/dim]")

    # Zaznamenej do paměti
    record_post(topic, post_type, post_data.get("hook_formula", ""))

    return post_data


# ══════════════════════════════════════════════════
# CMD: BLOG PROMO
# ══════════════════════════════════════════════════

def cmd_blog_promo(platform: str = "instagram", show_all: bool = False):
    print_banner()

    articles = load_blog_articles()
    if not articles:
        console.print("[red]Žádné články nenalezeny.[/red]")
        return

    if show_all:
        # Zobraz posledních 10 článků na výběr
        console.print("[bold]📚 Výběr článku k propagaci:[/bold]\n")
        recent_articles = articles[:10]
        for i, a in enumerate(recent_articles, 1):
            console.print(f"  [dim]{i:2}.[/dim] [cyan]{a.get('title', '')[:55]}[/cyan]  [dim]{a.get('published_at', '')}[/dim]")

        choice = IntPrompt.ask("\nVyber číslo článku", default=1)
        article = recent_articles[min(choice - 1, len(recent_articles) - 1)]
    else:
        article = get_article_for_promo() or articles[0]

    formatted = format_article_for_post(article)
    console.print(f"\nPropaguji: [cyan bold]{formatted['title']}[/cyan bold]")
    console.print(f"URL: [dim]{formatted['url']}[/dim]\n")

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as p:
        p.add_task("✨ Generuji blog promo post...", total=None)
        post_data = generate_post(
            post_type="blog_promo",
            topic=formatted['category'] or "mystika",
            platform=platform,
            blog_url=formatted['url'],
            blog_title=formatted['title'],
            extra_context=formatted['description'],
            variations=2,
        )

    if "variations" in post_data and post_data["variations"]:
        console.print("\n[bold green]✓ 2 varianty vygenerovány:[/bold green]\n")
        for i, var in enumerate(post_data["variations"], 1):
            console.print(Panel(var.get("caption", ""), title=f"Varianta {i}", border_style="green"))

        choice = IntPrompt.ask("Která varianta?", default=1)
        selected = post_data["variations"][min(choice - 1, 1)]
        post_data["caption"] = selected["caption"]
    else:
        console.print(Panel(post_data.get("caption", ""), title="Blog Promo", border_style="green"))

    generate_img = Confirm.ask("\nVygenerovat obrázek?", default=True)
    image_path = None
    if generate_img:
        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            image_path = generate_image(
                prompt=post_data.get("image_prompt", ""),
                platform=platform,
                post_type="square",
                filename=f"blog_{ts}",
            )
        except Exception as e:
            console.print(f"[yellow]⚠️  {e}[/yellow]")

    # Quality Gate
    console.print("\n[bold cyan]═══ QUALITY GATE ═══[/bold cyan]")
    post_data_for_review = {**post_data, "topic": formatted['title'], "post_type": "blog_promo"}
    qg_result = validate_post(post_data_for_review, platform, image_path, run_ai_review=False)
    print_quality_report(qg_result, verbose=True)

    if not qg_result["approved"]:
        action = Prompt.ask("Post neschválen. Uložit přesto?", choices=["save", "skip"], default="save")
        if action == "skip":
            console.print("[dim]Přeskočeno.[/dim]")
            return

    post_data["quality_score"] = qg_result["score"]
    json_path = save_post(post_data, image_path, platform, formatted['title'], "blog_promo")
    record_post(formatted['title'], "blog_promo", blog_slug=article.get("slug", ""))
    console.print(f"\n[green]✓ Blog promo uložen![/green]  Kvalita: [cyan]{qg_result['score']}/10[/cyan]")
    console.print(f"[dim]Náhled: {str(json_path).replace('.json', '.html')}[/dim]")


# ══════════════════════════════════════════════════
# CMD: STORIES
# ══════════════════════════════════════════════════

def cmd_story(topic: str, slides: int = 5):
    print_banner()
    console.print(f"[bold]📱 Generuji Instagram Stories sérii: [cyan]{topic}[/cyan][/bold]\n")

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as p:
        p.add_task(f"Generuji {slides} Stories slidů...", total=None)
        story_slides = generate_story_sequence(topic, story_count=slides)

    if not story_slides:
        console.print("[red]Nepodařilo se vygenerovat Stories.[/red]")
        return

    table = Table(title=f"📱 Stories: {topic}", border_style="purple", box=box.ROUNDED)
    table.add_column("Slide", style="bold cyan", width=6)
    table.add_column("Typ", style="yellow", width=10)
    table.add_column("Text", width=35)
    table.add_column("Interakce", style="green", width=20)
    table.add_column("Vizuál", style="dim", width=25)

    for slide in story_slides:
        table.add_row(
            str(slide.get("slide", "")),
            slide.get("type", ""),
            slide.get("text", "")[:50],
            str(slide.get("interactive", "—") or "—")[:25],
            slide.get("visual", "")[:40],
        )

    console.print(table)

    # Uložení
    config.POSTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    story_path = config.POSTS_DIR / f"story_{ts}_{slugify(topic)}.json"
    with open(story_path, 'w', encoding='utf-8') as f:
        json.dump({
            "type": "instagram_story",
            "topic": topic,
            "generated_at": datetime.now().isoformat(),
            "slides": story_slides,
        }, f, ensure_ascii=False, indent=2)

    # Quality Gate — kontrola textu všech slidů
    all_text = " ".join(s.get("text", "") for s in story_slides)
    qg_data = {"caption": all_text, "hashtags": [], "image_prompt": "", "call_to_action": "", "topic": topic, "post_type": "instagram_story"}
    qg_result = validate_post(qg_data, "instagram", run_ai_review=False)
    if qg_result["errors"] > 0:
        console.print(f"\n[bold red]⚠️  Quality Gate: {qg_result['summary']}[/bold red]")
        for issue in qg_result["issues"]:
            if issue["severity"] == "error":
                console.print(f"  [red]✗ {issue['message']}[/red]")
        action = Prompt.ask("Stories obsahují chyby. Uložit přesto?", choices=["save", "skip"], default="save")
        if action == "skip":
            # Smaž již uložený soubor
            story_path.unlink(missing_ok=True)
            console.print("[dim]Stories přeskočeny.[/dim]")
            return

    console.print(f"\n[green]✓ Stories plán uložen: {story_path.name}[/green]")
    record_post(topic, "instagram_story")


# _slugify odstraněn — používáme sdílený utils.slugify


# ══════════════════════════════════════════════════
# CMD: CAROUSEL
# ══════════════════════════════════════════════════

def cmd_carousel(topic: str, platform: str = "instagram"):
    print_banner()
    console.print(f"[bold]🎠 Generuji karusel: [cyan]{topic}[/cyan][/bold]\n")

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as p:
        p.add_task("Generuji karusel obsah...", total=None)
        carousel = generate_carousel(topic, slides=7, platform=platform)

    console.print(Panel(
        carousel.get("cover_caption", ""),
        title="📍 Cover Caption (feed)",
        border_style="cyan",
    ))
    console.print()

    table = Table(title=f"🎠 Karusel: {topic}", border_style="purple", box=box.ROUNDED)
    table.add_column("Slide", style="bold cyan", width=6)
    table.add_column("Nadpis", style="yellow", width=25)
    table.add_column("Text", width=35)
    table.add_column("Design tip", style="dim", width=25)

    for slide in carousel.get("slides", []):
        table.add_row(
            str(slide.get("slide", "")),
            slide.get("headline", "")[:30],
            slide.get("body", "")[:50],
            slide.get("design_note", "")[:30],
        )

    console.print(table)

    # Uložení
    config.POSTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    carousel_path = config.POSTS_DIR / f"carousel_{ts}_{slugify(topic)}.json"
    with open(carousel_path, 'w', encoding='utf-8') as f:
        json.dump({
            "type": "carousel",
            "platform": platform,
            "topic": topic,
            "generated_at": datetime.now().isoformat(),
            **carousel,
        }, f, ensure_ascii=False, indent=2)

    # Quality Gate — kontrola cover caption + slide textů
    all_text = carousel.get("cover_caption", "")
    all_text += " " + " ".join(s.get("body", "") for s in carousel.get("slides", []))
    qg_data = {
        "caption": all_text,
        "hashtags": carousel.get("hashtags", []),
        "image_prompt": carousel.get("image_prompt_cover", ""),
        "call_to_action": "",
        "topic": topic, "post_type": "carousel",
    }
    qg_result = validate_post(qg_data, platform, run_ai_review=False)
    if qg_result["errors"] > 0:
        console.print(f"\n[bold red]⚠️  Quality Gate: {qg_result['summary']}[/bold red]")
        for issue in qg_result["issues"]:
            if issue["severity"] == "error":
                console.print(f"  [red]✗ {issue['message']}[/red]")
        action = Prompt.ask("Karusel obsahuje chyby. Uložit přesto?", choices=["save", "skip"], default="save")
        if action == "skip":
            carousel_path.unlink(missing_ok=True)
            console.print("[dim]Karusel přeskočen.[/dim]")
            return

    console.print(f"\n[green]✓ Karusel uložen: {carousel_path.name}[/green]")
    record_post(topic, "carousel")


# ══════════════════════════════════════════════════
# CMD: PLAN
# ══════════════════════════════════════════════════

def cmd_plan():
    print_banner()
    console.print("[bold]📅 Generuji týdenní plán s lunárním kontextem...[/bold]\n")

    from datetime import date
    current_week = date.today().isocalendar()[1]
    current_year = date.today().year

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as p:
        p.add_task(f"Gemini Flash plánuje týden {current_week}/{current_year}...", total=None)
        plan = generate_weekly_content_plan(current_week, current_year)

    if not plan:
        console.print("[red]Nepodařilo se vygenerovat plán.[/red]")
        return

    table = Table(
        title=f"📅 Týdenní Plán — Týden {current_week}/{current_year}",
        border_style="purple",
        box=box.ROUNDED,
    )
    table.add_column("Den", style="bold cyan", width=10)
    table.add_column("Typ", style="yellow", width=14)
    table.add_column("Téma", style="green", width=30)
    table.add_column("Čas", style="dim", width=6)
    table.add_column("Měsíc", style="magenta", width=8)
    table.add_column("Popis", width=40)

    for day in plan:
        table.add_row(
            day.get("day", ""),
            day.get("post_type", ""),
            day.get("topic", "")[:35],
            day.get("best_time", ""),
            day.get("moon_connection", "")[:10],
            day.get("brief", "")[:55],
        )

    console.print(table)

    # Uložení
    plan_path = config.POSTS_DIR / f"plan_week_{current_week}_{current_year}.json"
    config.POSTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(plan_path, 'w', encoding='utf-8') as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)

    console.print(f"\n[green]✓ Plán uložen: {plan_path.name}[/green]")
    console.print("\n[dim]Generuj konkrétní posty: python agent.py generate[/dim]")


# ══════════════════════════════════════════════════
# CMD: LIST
# ══════════════════════════════════════════════════

def cmd_list():
    print_banner()
    posts = load_all_posts()

    if not posts:
        console.print("[dim]Žádné posty. Začni s: python agent.py generate[/dim]")
        return

    draft = [p for p in posts if p.get("status") == "draft"]
    approved = [p for p in posts if p.get("status") == "approved"]
    published = [p for p in posts if p.get("status") == "published"]

    console.print(f"[bold]Přehled:[/bold] [yellow]{len(draft)} draft[/yellow] · "
                  f"[green]{len(approved)} approved[/green] · "
                  f"[blue]{len(published)} published[/blue] · "
                  f"[dim]{len(posts)} celkem[/dim]\n")

    table = Table(border_style="purple", box=box.SIMPLE)
    table.add_column("Datum", style="dim", width=16)
    table.add_column("Plat.", style="cyan", width=6)
    table.add_column("Téma", style="green", width=28)
    table.add_column("Typ", style="yellow", width=14)
    table.add_column("Status", width=10)
    table.add_column("Hook vzorec", style="dim", width=18)

    for post in posts[:20]:
        status_map = {
            "draft": "[yellow]DRAFT[/yellow]",
            "approved": "[green]APPROVED[/green]",
            "published": "[blue]PUBLISHED[/blue]",
        }
        table.add_row(
            post.get("generated_at", "")[:16].replace("T", " "),
            post.get("platform", "")[:3],
            post.get("topic", "")[:30],
            post.get("post_type", "")[:15],
            status_map.get(post.get("status", "draft"), "—"),
            post.get("hook_formula", "")[:20],
        )

    console.print(table)

    if len(posts) > 20:
        console.print(f"[dim]... a {len(posts) - 20} dalších[/dim]")


# ══════════════════════════════════════════════════
# CMD: REPLY
# ══════════════════════════════════════════════════

def cmd_reply(comment: str):
    print_banner()
    console.print(f"[bold]💬 Komentář:[/bold] [italic]\"{comment}\"[/italic]\n")

    topic = Prompt.ask("Téma postu (ke kterému patří komentář)", default="tarot")
    tone = Prompt.ask("Tón odpovědi", choices=["friendly", "empathetic", "educational", "playful"], default="friendly")

    with Progress(SpinnerColumn(), TextColumn("Generuji odpověď..."), transient=True) as p:
        p.add_task("", total=None)
        reply = generate_comment_reply(original_comment=comment, post_topic=topic, tone=tone)

    console.print(Panel(reply, title="💬 Navrhovaná odpověď", border_style="green"))

    if Confirm.ask("\nZkopírovat do schránky?", default=True):
        try:
            import subprocess
            subprocess.run(['clip'], input=reply.encode('utf-16'), check=True)
            console.print("[green]✓ Zkopírováno![/green]")
        except Exception as e:
            log.debug("Clipboard nedostupný: %s", e)
            console.print(f"\n[bold]{reply}[/bold]")


# ══════════════════════════════════════════════════
# CMD: COMMENTS (správa komentářů z Meta API)
# ══════════════════════════════════════════════════

def cmd_comments(sync: bool = False, platform: str = None, auto_reply: bool = False):
    print_banner()

    has_meta = bool(config.META_ACCESS_TOKEN)

    # === SYNC — načti nové komentáře ===
    if sync:
        if not has_meta:
            console.print(Panel(
                "[yellow]META_ACCESS_TOKEN není nastaven v .env[/yellow]\n\n"
                "Pro automatické načítání komentářů:\n"
                "1. Vytvoř Facebook Business stránku\n"
                "2. Vytvoř Meta Developer App na developers.facebook.com\n"
                "3. Přidej Page Access Token do .env jako META_ACCESS_TOKEN\n\n"
                "[dim]Zatím můžeš používat manuální režim: python agent.py reply \"text\"[/dim]",
                title="Napojení na Meta API",
                border_style="yellow",
            ))
            return

        console.print("[bold]Synchronizuji komentáře...[/bold]")
        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), transient=True) as p:
            p.add_task("Načítám komentáře z Facebook + Instagram...", total=None)
            try:
                stats = sync_comments(since_hours=48)
                console.print(f"[green]✓ Nové: {stats['added']} · Přeskočené: {stats['skipped']} · Odpovědi vygenerovány: {stats['replies_generated']}[/green]\n")
            except Exception as e:
                console.print(f"[red]Chyba synchronizace: {e}[/red]")
                return

    # === ZOBRAZ STATISTIKY ===
    try:
        stats = get_stats()
        console.print(Panel(
            f"Celkem v DB: [bold]{stats['total']}[/bold]  ·  "
            f"Čekají na odpověď: [yellow bold]{stats['pending']}[/yellow bold]  ·  "
            f"Posledni sync: [dim]{stats['last_fetch'][:16].replace('T',' ') if stats['last_fetch'] != 'nikdy' else 'nikdy'}[/dim]\n\n"
            f"[dim]Facebook: {stats['by_platform'].get('facebook', 0)}  ·  "
            f"Instagram: {stats['by_platform'].get('instagram', 0)}[/dim]\n"
            f"[dim]Otázky: {stats['by_sentiment'].get('question', 0)}  ·  "
            f"Pozitivní: {stats['by_sentiment'].get('positive', 0)}  ·  "
            f"Skeptické: {stats['by_sentiment'].get('skeptical', 0)}  ·  "
            f"Spam: {stats['by_sentiment'].get('spam', 0)}[/dim]",
            title="Komentáře — Přehled",
            border_style="purple",
        ))
    except Exception as e:
        console.print(f"[dim]Statistiky nedostupné: {e}[/dim]")

    # === ZOBRAZ PENDING KOMENTÁŘE ===
    pending = []
    try:
        pending = get_pending_comments(platform=platform, min_priority=3)
    except Exception as e:
        console.print(f"[dim]Nelze načíst komentáře: {e}[/dim]")

    if not pending:
        if not has_meta:
            console.print("\n[dim]Žádné komentáře v DB. Spusť --sync po nastavení Meta API.[/dim]")
        else:
            console.print("\n[green]Žádné nevyřízené komentáře[/green]")
        return

    console.print(f"\n[bold]Nevyřízené komentáře ({len(pending)}):[/bold]\n")

    # Zobraz komentáře v tabulce
    table = Table(border_style="purple", box=box.ROUNDED)
    table.add_column("#", style="dim", width=3)
    table.add_column("Platforma", style="cyan", width=8)
    table.add_column("Od", style="yellow", width=15)
    table.add_column("Komentář", width=40)
    table.add_column("Sentiment", width=10)
    table.add_column("Návrh odpovědi", width=35)

    sentiment_colors = {
        "question": "[bold cyan]Otázka[/bold cyan]",
        "positive": "[green]Pozitivní[/green]",
        "skeptical": "[yellow]Skeptický[/yellow]",
        "neutral": "[dim]Neutrální[/dim]",
        "negative": "[red]Negativní[/red]",
    }

    for i, c in enumerate(pending[:15], 1):
        table.add_row(
            str(i),
            c.get("platform", ""),
            c.get("from_name", "")[:15],
            c.get("message", "")[:45],
            sentiment_colors.get(c.get("sentiment", ""), c.get("sentiment", "")),
            (c.get("suggested_reply") or "[dim]bez návrhu[/dim]")[:40],
        )

    console.print(table)

    if not has_meta:
        console.print("\n[dim]Pro publikaci odpovědí nastavte META_ACCESS_TOKEN v .env[/dim]")
        return

    # === INTERAKTIVNÍ ODPOVÍDÁNÍ ===
    if not auto_reply:
        if not Confirm.ask("\nChceš zpracovat komentáře interaktivně?", default=True):
            return

    for i, comment in enumerate(pending[:15], 1):
        console.print(f"\n[bold cyan]--- Komentář {i}/{min(len(pending), 15)} ---[/bold cyan]")
        console.print(f"[dim]Platforma:[/dim] {comment['platform']}  [dim]Od:[/dim] {comment['from_name']}")
        console.print(f"[dim]Post:[/dim] {comment.get('post_message', '')[:60]}")
        console.print(Panel(comment['message'], title="Komentář", border_style="dim"))

        if comment.get("suggested_reply"):
            console.print(Panel(comment['suggested_reply'], title="Navrhovaná odpověď (AI)", border_style="green"))

        if auto_reply and comment.get("suggested_reply"):
            # Automatický mód — odešle návrh bez potvrzení
            result = reply_to_comment(comment["id"], comment["suggested_reply"])
            if result["success"]:
                console.print("[green]✓ Odpověď odeslána automaticky[/green]")
            else:
                console.print(f"[red]✗ Chyba: {result.get('error')}[/red]")
            continue

        # Manuální mód
        action = Prompt.ask(
            "Akce",
            choices=["odeslat", "upravit", "přeskočit", "skrýt", "konec"],
            default="odeslat" if comment.get("suggested_reply") else "přeskočit",
        )

        if action == "konec":
            break
        elif action == "přeskočit":
            continue
        elif action == "skrýt":
            result = hide_comment(comment["id"], comment["platform"])
            console.print("[green]✓ Komentář skryt[/green]" if result["success"] else f"[red]✗ {result.get('error')}[/red]")
        elif action == "upravit":
            new_reply = Prompt.ask("Uprav odpověď", default=comment.get("suggested_reply", ""))
            result = reply_to_comment(comment["id"], new_reply)
            console.print("[green]✓ Odpověď odeslána[/green]" if result["success"] else f"[red]✗ {result.get('error')}[/red]")
        elif action == "odeslat":
            reply_text = comment.get("suggested_reply", "")
            if not reply_text:
                reply_text = Prompt.ask("Napište odpověď")
            result = reply_to_comment(comment["id"], reply_text)
            console.print("[green]✓ Odpověď odeslána[/green]" if result["success"] else f"[red]✗ {result.get('error')}[/red]")

    console.print("\n[bold green]Zpracování komentářů dokončeno.[/bold green]")


# ══════════════════════════════════════════════════
# CMD: ASTRO
# ══════════════════════════════════════════════════

def cmd_astro():
    print_banner()
    try:
        ctx = get_full_astrological_context()
        console.print(Panel(
            f"{ctx['moon']['emoji']} [bold]Měsíc:[/bold] {ctx['moon']['phase_cs']}  "
            f"([dim]{ctx['moon']['illumination_approx']}% osvětlení[/dim])\n"
            f"  Energie: {ctx['moon']['energy_type']}\n"
            f"  Content: [cyan]{ctx['moon']['content_angle']}[/cyan]\n"
            f"  Rituál: {ctx['moon']['ritual_tip']}\n"
            f"  Téma: [dim]{ctx['moon']['spiritual_theme']}[/dim]\n\n"
            f"{ctx['sun']['symbol']} [bold]Slunce:[/bold] {ctx['sun']['sign_cs']} {ctx['sun']['element']}\n"
            f"  Témata: {ctx['sun']['themes']}\n\n"
            f"🔢 [bold]Universální den {ctx['universal_day']}:[/bold] {ctx['universal_day_meaning']}",
            title=f"🔮 Astrologický Kontext — {ctx['date']}",
            border_style="purple",
        ))
    except Exception as e:
        console.print(f"[red]Chyba: {e}[/red]")


# ══════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="🔮 Mystická Hvězda — Social Media Agent v2",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    sub = parser.add_subparsers(dest="command")

    gen = sub.add_parser("generate", help="Generuj post")
    gen.add_argument("--auto", action="store_true")
    gen.add_argument("--platform", default="instagram", choices=["instagram", "facebook"])
    gen.add_argument("--variations", type=int, default=1)

    blog = sub.add_parser("blog", help="Blog promo post")
    blog.add_argument("--platform", default="instagram", choices=["instagram", "facebook"])
    blog.add_argument("--all", action="store_true", dest="show_all", help="Zobraz výběr článků")

    story = sub.add_parser("story", help="Instagram Stories série")
    story.add_argument("topic", help="Téma stories")
    story.add_argument("--slides", type=int, default=5)

    carousel = sub.add_parser("carousel", help="Karusel post")
    carousel.add_argument("topic", help="Téma karuselu")
    carousel.add_argument("--platform", default="instagram")

    sub.add_parser("plan", help="Týdenní plán obsahu")
    sub.add_parser("list", help="Přehled postů")
    sub.add_parser("astro", help="Dnešní astro kontext")

    reply = sub.add_parser("reply", help="Manuální odpověď na komentář")
    reply.add_argument("comment", help="Text komentáře v uvozovkách")

    comments_p = sub.add_parser("comments", help="Správa komentářů z FB + IG")
    comments_p.add_argument("--sync", action="store_true", help="Načti nové komentáře z API")
    comments_p.add_argument("--platform", choices=["facebook", "instagram"], default=None)
    comments_p.add_argument("--auto", action="store_true", dest="auto_reply",
                             help="Automaticky odeslat AI odpovědi bez potvrzení")

    args = parser.parse_args()

    if args.command == "generate":
        cmd_generate(auto=args.auto, platform=args.platform, variations=args.variations)
    elif args.command == "blog":
        cmd_blog_promo(platform=args.platform, show_all=args.show_all)
    elif args.command == "story":
        cmd_story(topic=args.topic, slides=args.slides)
    elif args.command == "carousel":
        cmd_carousel(topic=args.topic, platform=args.platform)
    elif args.command == "plan":
        cmd_plan()
    elif args.command == "list":
        cmd_list()
    elif args.command == "astro":
        cmd_astro()
    elif args.command == "reply":
        cmd_reply(comment=args.comment)
    elif args.command == "comments":
        cmd_comments(sync=args.sync, platform=args.platform, auto_reply=args.auto_reply)
    else:
        parser.print_help()
        console.print()
        console.print("[dim]Nejrychlejší start:[/dim]")
        console.print("  [bold]python agent.py astro[/bold]          — co dnes říkají hvězdy")
        console.print("  [bold]python agent.py generate[/bold]       — vytvoř post")
        console.print("  [bold]python agent.py plan[/bold]           — plán na celý týden")
        console.print("  [bold]python agent.py comments --sync[/bold] — správa komentářů")


if __name__ == "__main__":
    main()
