#!/usr/bin/env python3
"""Parse AIU schedule workbook (.xlsx) into normalized JSON for P5R Schedule."""

from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import openpyxl

SOURCE_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1EKBtXh6KMGzqrgh8P_x1-gIwkV5sP6TFfyH-fHMpiOI/edit?usp=drivesdk"
)
EXPORT_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1EKBtXh6KMGzqrgh8P_x1-gIwkV5sP6TFfyH-fHMpiOI/export?format=xlsx"
)

TARGET_GROUPS: list[str] = ["COMSE26B", "COMSE26A", "COMSEH26", "COMCIF26"]
TARGET_GROUP_DISPLAY_ORDER: list[str] = ["COMSE26A", "COMSE26B", "COMSEH26", "COMCIF26"]
DAY_SHEETS: list[str] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
DAY_ORDER: dict[str, int] = {day: idx for idx, day in enumerate(DAY_SHEETS)}

TEACHER_ALIASES: dict[str, str] = {
    "azhar kazakbaeva": "Azhar Kazakbaeva",
    "azhar kazakbekova": "Azhar Kazakbaeva",
    "zhibek naamatova": "Zhibek Naamatova",
    "zhibek namatova": "Zhibek Naamatova",
    "zhazgul alymbaeva": "Zhazgul Alymbaeva",
    "zhazgul alymbekova": "Zhazgul Alymbaeva",
    "mehtap": "Mehtap Khan",
    "mehtap khan": "Mehtap Khan",
    "tattybubu arap kyzy": "Tattybubu Arap kyzy",
    "tattybubu arap k": "Tattybubu Arap kyzy",
    "tatybubu arapova": "Tattybubu Arap kyzy",
    "татыбубу арап кызы": "Tattybubu Arap kyzy",
    "hussein chebsi": "Hussein Chebsi",
    "nurlan mukambaev": "Nurlan Mukambaev",
    "nurlan mukanbaev": "Nurlan Mukambaev",
    "niyazhan shabdanaliev": "Niyazhan Shabdanaliev",
    "shabdanaliev niiazkhan": "Niyazhan Shabdanaliev",
    "tauheed khan": "Muhammad Tauheed Khan",
    "muhammad tauheed khan": "Muhammad Tauheed Khan",
    "sherali matanov": "Sherali Matanov",
    "шерали матанов": "Sherali Matanov",
    "liliya abdieva": "Liliya Abdieva",
    "лилия абдиева": "Liliya Abdieva",
    "gulnarida zhalilova": "Gulnarida Zhalilova",
    "гульнарида жалилова": "Gulnarida Zhalilova",
    "bufatima nurmakhammed k": "Bufatima Nurmakhammed k",
    "bufatima nurmahammad k": "Bufatima Nurmakhammed k",
    "bufatima nurmukhammed k": "Bufatima Nurmakhammed k",
    "bufatima nurmuhammad k": "Bufatima Nurmakhammed k",
    "nurayim kuletova": "Nurayim Kuletova",
    "nuraiym kuletova": "Nurayim Kuletova",
}

HONORIFIC_RE = re.compile(
    r"^(?:(?:dr|mr|ms|mrs|prof)\.?\s*|ст\.?\s*пред\.?\s*)+",
    flags=re.IGNORECASE,
)
TIME_RANGE_RE = re.compile(
    r"^\s*(\d{1,2})[.:](\d{2})\s*[-–—]\s*(\d{1,2})[.:](\d{2})\s*$"
)
TRAILING_ROOM_RE = re.compile(
    r"""
    (?P<room>
        (?:[A-Z]\s*\d{3}(?:\s*\([^)]+\)|\s+LAB)?)|
        (?:LAB\s*\d+(?:\s*\(\d+\)|\s+\d+)?)|
        (?:BIG\s*LAB)|
        (?:Sport\s+Hall)|
        (?:D\s+block\s+\d+)|
        (?:Registrar's\s+office)
    )\s*$
    """,
    flags=re.IGNORECASE | re.VERBOSE,
)

# Color codes observed in workbook (ARGB hex strings)
COLOR_FIXED_CREAM = {"FFFFF2CC", "FFFCE5CD"}
COLOR_ADVISOR_YELLOW = {"FFFFFF00", "FFFFF9C4"}
COLOR_ELECTIVE_PURPLE = {"FFEAD1DC", "FFD9D2E9", "FFE1D5E7", "FFCC99FF"}
COLOR_LUNCH_GREEN = {"FFB6D7A8", "FFD9EAD3", "FFC9DAF8"}


def slugify(text: str) -> str:
    """Create a deterministic ASCII/lowercase slug."""
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "item"


def clean_ws(text: str) -> str:
    """Collapse internal whitespace to single spaces."""
    return re.sub(r"\s+", " ", text).strip()


def normalize_time_str(hour: str, minute: str) -> str:
    """Format hour and minute as HH:MM."""
    return f"{int(hour):02d}:{int(minute):02d}"


def parse_time_range(raw: Any) -> tuple[str, str] | None:
    """Parse cell text like '08.00-08.40' or '15:30 - 16:10' into ('08:00', '08:40')."""
    if raw is None:
        return None
    m = TIME_RANGE_RE.match(str(raw))
    if not m:
        return None
    return (
        normalize_time_str(m.group(1), m.group(2)),
        normalize_time_str(m.group(3), m.group(4)),
    )


def normalize_single_time(raw: Any) -> str | None:
    """Normalize a single time string like '08.00' or '13:40' -> 'HH:MM'."""
    if raw is None:
        return None
    m = re.match(r"^\s*(\d{1,2})[.:](\d{2})\s*$", str(raw))
    if not m:
        return None
    return normalize_time_str(m.group(1), m.group(2))


def normalize_group_id(raw: Any, require_year: bool = True) -> str | None:
    """Normalize any target group spelling to one of the 4 canonical IDs."""
    if raw is None:
        return None
    s = str(raw).upper().strip()
    s = re.sub(r"\bGROUP\b", "", s)
    compact = re.sub(r"[^A-Z0-9]", "", s)

    mapping_with_year = {
        "COMSE26A": "COMSE26A",
        "COMSE26B": "COMSE26B",
        "COMCEH26": "COMSEH26",
        "COMSEH26": "COMSEH26",
        "COMCIF26": "COMCIF26",
        "COMFCI26": "COMCIF26",
    }
    if compact in mapping_with_year:
        return mapping_with_year[compact]

    if not require_year:
        mapping_no_year = {
            "COMSEA": "COMSE26A",
            "COMSEB": "COMSE26B",
            "COMCEH": "COMSEH26",
            "COMSEH": "COMSEH26",
            "COMCIF": "COMCIF26",
            "COMFCI": "COMCIF26",
        }
        return mapping_no_year.get(compact)

    return None


def extract_target_groups_from_text(text: str) -> list[str]:
    """Extract any canonical target group IDs mentioned inside free text."""
    found: list[str] = []
    patterns = [
        (r"\bCOMSE[-\s]*26\s*A\b", "COMSE26A"),
        (r"\bCOMSE[-\s]*26\s*B\b", "COMSE26B"),
        (r"\bCOM[CS]EH[-\s]*26\b", "COMSEH26"),
        (r"\bCOM(?:CIF|FCI)[-\s]*26\b", "COMCIF26"),
    ]
    upper = text.upper()
    for pattern, gid in patterns:
        if re.search(pattern, upper) and gid not in found:
            found.append(gid)
    return sorted(found, key=lambda g: TARGET_GROUP_DISPLAY_ORDER.index(g))


def normalize_room(raw: str | None) -> str | None:
    """Normalize room tokens like 'B 201', 'Biglab', 'LAB4 211'."""
    if not raw:
        return None
    r = clean_ws(raw)
    if not r:
        return None
    # B 201 -> B201
    r = re.sub(r"^([A-Za-z])\s+(\d{3}\b)", lambda m: m.group(1).upper() + m.group(2), r)
    # LAB4 211 -> LAB4(211)
    r = re.sub(r"^(LAB\d+)\s+(\d{3})$", r"\1(\2)", r, flags=re.IGNORECASE)
    # Biglab / BIGLAB -> BIGLAB
    if r.lower() in {"biglab", "big lab"}:
        return "BIGLAB"
    if r.lower().startswith("lab"):
        r = re.sub(r"^lab", "LAB", r, flags=re.IGNORECASE)
    if r.lower().endswith(" lab"):
        r = r[:-4].strip().upper() + " LAB"
    if re.match(r"^[a-z]\d{3}$", r):
        r = r.upper()
    return r


def canonicalize_teacher(
    raw: str,
    known_names: dict[str, str] | None = None,
    fuzzy_matches: list[str] | None = None,
) -> str:
    """Strip honorifics, normalize whitespace, and resolve known teacher aliases."""
    name = clean_ws(raw)
    name = HONORIFIC_RE.sub("", name).strip(" ,;-")
    name = clean_ws(name)
    key = name.lower()

    if key in TEACHER_ALIASES:
        return TEACHER_ALIASES[key]

    if known_names:
        if key in known_names:
            return known_names[key]
        # Conservative fuzzy match only for pure Latin strings >= 8 chars
        if re.fullmatch(r"[a-z\s.]+", key) and len(key) >= 8:
            best_score = 0.0
            best_name = None
            for k_known, canon in known_names.items():
                if not re.fullmatch(r"[a-z\s.]+", k_known):
                    continue
                score = difflib.SequenceMatcher(None, key, k_known).ratio()
                if score > best_score:
                    best_score = score
                    best_name = canon
            if best_name and best_score >= 0.88:
                if fuzzy_matches is not None and name != best_name:
                    fuzzy_matches.append(f"{name!r} -> {best_name!r} ({best_score:.2f})")
                return best_name

    # Normalize capitalization if all-lowercase or title-case needed
    if name == name.lower() and len(name) > 2:
        name = " ".join(
            part if part.lower() in {"k", "k.", "kyzy", "uulu"} else part.capitalize()
            for part in name.split()
        )
    return name


def split_teacher_and_room(text: str) -> tuple[str, str | None]:
    """Extract (teacher_raw, room) from a line like 'Ms. Zhibek Naamatova B103 link'."""
    line = clean_ws(text)
    # Remove trailing 'link' marker added for online links on Friday
    line = re.sub(r"\s+\blink\b\.?$", "", line, flags=re.IGNORECASE).strip()

    # Pattern with slash: 'Mr. Emilbek Zholdoshbekov / B113'
    if "/" in line:
        parts = [p.strip() for p in line.split("/") if p.strip()]
        if len(parts) == 2:
            m_room = TRAILING_ROOM_RE.search(parts[1])
            if m_room and len(parts[1]) <= len(m_room.group("room")) + 3:
                return parts[0], normalize_room(m_room.group("room"))

    m = TRAILING_ROOM_RE.search(line)
    if m:
        room = normalize_room(m.group("room"))
        teacher_part = line[: m.start()].strip(" /-")
        return teacher_part, room

    return line, None


def normalize_subject(raw: str) -> tuple[str, bool]:
    """Normalize subject title and return (subject, has_star)."""
    s = clean_ws(raw)
    has_star = "★" in s
    s = s.replace("★", "").strip()
    if s.upper() == "CALCULUS I":
        s = "Calculus I"
    elif s.upper() == "LINEAR ALGEBRA":
        s = "Linear Algebra"
    elif s.upper() == "BASICS OF SCIENCE RESEARCH":
        s = "Basics of science research"
    return s, has_star


def get_fill_rgb(cell: Any) -> str | None:
    """Return ARGB string for solid cell fill if available."""
    fill = getattr(cell, "fill", None)
    if not fill or not fill.fill_type:
        return None
    fg = getattr(fill, "fgColor", None)
    if not fg:
        return None
    if getattr(fg, "type", None) == "rgb" and fg.rgb:
        return str(fg.rgb).upper()
    return None


def build_merge_lookup(ws: openpyxl.worksheet.worksheet.Worksheet) -> dict[tuple[int, int], tuple[int, int, int, int]]:
    """Map every (row, col) inside a merged range to (min_row, min_col, max_row, max_col)."""
    lookup: dict[tuple[int, int], tuple[int, int, int, int]] = {}
    for rng in ws.merged_cells.ranges:
        bounds = (rng.min_row, rng.min_col, rng.max_row, rng.max_col)
        for r in range(rng.min_row, rng.max_row + 1):
            for c in range(rng.min_col, rng.max_col + 1):
                lookup[(r, c)] = bounds
    return lookup


class TeacherRegistry:
    """Registry that canonicalizes and accumulates faculty metadata."""

    def __init__(self) -> None:
        self.teachers: dict[str, dict[str, Any]] = {}
        self.known_lower: dict[str, str] = {}
        self.fuzzy_matches: list[str] = []

    def ensure(self, raw_name: str) -> dict[str, Any]:
        canon = canonicalize_teacher(raw_name, self.known_lower, self.fuzzy_matches)
        tid = slugify(canon)
        if tid not in self.teachers:
            self.teachers[tid] = {
                "id": tid,
                "name": canon,
                "courses": set(),
                "officeHours": [],
                "room": None,
                "isCustom": False,
            }
            self.known_lower[canon.lower()] = canon
        return self.teachers[tid]

    def add_course(self, raw_name: str, course: str) -> dict[str, Any]:
        t = self.ensure(raw_name)
        c = clean_ws(course)
        if c:
            t["courses"].add(c)
        return t

    def add_office_hour(
        self, raw_name: str, day: str, start_time: str, end_time: str, room: str | None
    ) -> dict[str, Any]:
        t = self.ensure(raw_name)
        slot = {
            "day": day,
            "startTime": start_time,
            "endTime": end_time,
            "room": room,
        }
        if slot not in t["officeHours"]:
            t["officeHours"].append(slot)
        if room and not t["room"]:
            t["room"] = room
        return t

    def set_room_if_empty(self, raw_name: str, room: str | None) -> dict[str, Any]:
        t = self.ensure(raw_name)
        if room and not t["room"]:
            t["room"] = room
        return t

    def export(self) -> list[dict[str, Any]]:
        result = []
        for t in sorted(self.teachers.values(), key=lambda x: x["name"].lower()):
            oh = sorted(
                t["officeHours"],
                key=lambda s: (DAY_ORDER.get(s["day"], 99), s["startTime"]),
            )
            result.append(
                {
                    "id": t["id"],
                    "name": t["name"],
                    "courses": sorted(t["courses"], key=str.lower),
                    "officeHours": oh,
                    "room": t["room"],
                    "isCustom": False,
                }
            )
        return result


def parse_office_hours(
    wb: openpyxl.Workbook, registry: TeacherRegistry, special_notes: list[str]
) -> int:
    """Parse 'Office Hours Fall' sheet considering merged cells."""
    if "Office Hours Fall" not in wb.sheetnames:
        special_notes.append("Лист 'Office Hours Fall' не найден в книге.")
        return 0

    ws = wb["Office Hours Fall"]
    merges = build_merge_lookup(ws)

    # Locate header row with time ranges (row 4)
    header_row = None
    time_cols: dict[int, tuple[str, str]] = {}
    for r in range(1, min(12, ws.max_row + 1)):
        found: dict[int, tuple[str, str]] = {}
        for c in range(1, ws.max_column + 1):
            tr = parse_time_range(ws.cell(r, c).value)
            if tr:
                found[c] = tr
        if len(found) >= 5:
            header_row = r
            time_cols = found
            break

    if header_row is None:
        special_notes.append("В листе 'Office Hours Fall' не найдена строка времени.")
        return 0

    min_tc = min(time_cols)
    max_tc = max(time_cols)
    day_col = min_tc - 1  # col B (2)

    # Resolve day per row via merges in day_col (only valid weekdays, skip merged header row)
    row_days: dict[int, str] = {}
    for r in range(header_row + 1, ws.max_row + 1):
        bounds = merges.get((r, day_col), (r, day_col, r, day_col))
        if bounds[0] <= header_row:
            continue
        val = ws.cell(bounds[0], bounds[1]).value
        if val and str(val).strip():
            day_name = clean_ws(str(val)).upper()
            if day_name in DAY_ORDER:
                row_days[r] = day_name

    parsed_count = 0
    seen_rects: set[tuple[int, int, int, int]] = set()
    for r in range(header_row + 1, ws.max_row + 1):
        day = row_days.get(r)
        if not day:
            continue
        for c in range(min_tc, max_tc + 1):
            rect = merges.get((r, c), (r, c, r, c))
            if rect in seen_rects:
                continue
            seen_rects.add(rect)
            r1, c1, _r2, c2 = rect
            if r1 <= header_row:
                continue
            raw_val = ws.cell(r1, c1).value
            if raw_val is None:
                continue
            text = clean_ws(str(raw_val))
            if not text or text.upper() == "LUNCH":
                continue
            if c1 not in time_cols or c2 not in time_cols:
                special_notes.append(f"Office Hours: вне диапазона времени {rect}: {text!r}")
                continue
            start_time = time_cols[c1][0]
            end_time = time_cols[c2][1]
            teacher_raw, room = split_teacher_and_room(text)
            if not teacher_raw:
                special_notes.append(f"Office Hours: не распознано имя в {rect}: {text!r}")
                continue
            registry.add_office_hour(teacher_raw, day, start_time, end_time, room)
            parsed_count += 1

    return parsed_count


def parse_lecturer_load(wb: openpyxl.Workbook, registry: TeacherRegistry) -> None:
    """Parse 'Lecturer Load' sheet to populate faculty and courses."""
    if "Lecturer Load" not in wb.sheetnames:
        return
    ws = wb["Lecturer Load"]
    for r in range(2, ws.max_row + 1):
        lecturer_raw = ws.cell(r, 1).value
        courses_raw = ws.cell(r, 5).value
        if not lecturer_raw:
            continue
        lecturers = [p.strip() for p in str(lecturer_raw).split("/") if p.strip()]
        course_list: list[str] = []
        if courses_raw:
            for chunk in re.split(r"\s*\|\s*|\n+", str(courses_raw)):
                c = clean_ws(chunk)
                if not c:
                    continue
                # Strip trailing '(COMSE-24)' or '(COMSE-26A, ...)'
                c = re.sub(r"\s*\([^)]*2[3-6][^)]*\)\s*$", "", c).strip()
                # Also handle '(group 1)' remnants
                c = re.sub(r"\s*/\s*$", "", c).strip()
                if c:
                    course_list.append(c)
        for lec in lecturers:
            registry.ensure(lec)
            for course in course_list:
                registry.add_course(lec, course)


def parse_supervisors(
    wb: openpyxl.Workbook, registry: TeacherRegistry
) -> dict[str, dict[str, str | None]]:
    """Parse 'Supervisors' sheet for advisor names & offices of target groups."""
    advisors: dict[str, dict[str, str | None]] = {}
    if "Supervisors" not in wb.sheetnames:
        return advisors

    ws = wb["Supervisors"]
    # Find header row
    header_row = None
    col_map: dict[str, int] = {}
    for r in range(1, min(10, ws.max_row + 1)):
        vals = {str(ws.cell(r, c).value or "").strip().lower(): c for c in range(1, ws.max_column + 1)}
        if "group" in vals and "advisor" in vals:
            header_row = r
            col_map = vals
            break
    if header_row is None:
        return advisors

    for r in range(header_row + 1, ws.max_row + 1):
        grp_raw = ws.cell(r, col_map["group"]).value
        adv_raw = ws.cell(r, col_map["advisor"]).value
        office_raw = ws.cell(r, col_map.get("office", 0)).value if "office" in col_map else None
        if not grp_raw or not adv_raw:
            continue

        grp_compact = re.sub(r"[^A-Z0-9]", "", str(grp_raw).upper())
        if grp_compact == "COMSE26":
            gids = ["COMSE26A", "COMSE26B"]
        else:
            gid = normalize_group_id(grp_raw, require_year=True)
            gids = [gid] if gid else []

        room = normalize_room(str(office_raw)) if office_raw else None
        t = registry.set_room_if_empty(str(adv_raw), room)
        for gid in gids:
            advisors[gid] = {
                "advisor": t["name"],
                "advisorId": t["id"],
                "advisorRoom": room,
            }
    return advisors


def parse_group_load(
    wb: openpyxl.Workbook, advisors: dict[str, dict[str, str | None]]
) -> tuple[list[dict[str, Any]], dict[str, dict[str, float]]]:
    """Parse 'Group Load' sheet for shift, weekly hours, and expected daily hours."""
    groups_by_id: dict[str, dict[str, Any]] = {}
    expected_daily: dict[str, dict[str, float]] = {}

    if "Group Load" in wb.sheetnames:
        ws = wb["Group Load"]
        headers = {
            str(ws.cell(1, c).value or "").strip(): c for c in range(1, ws.max_column + 1)
        }
        for r in range(2, ws.max_row + 1):
            raw_name = ws.cell(r, headers.get("Group", 1)).value
            gid = normalize_group_id(raw_name, require_year=True)
            if not gid:
                continue
            year_val = ws.cell(r, headers.get("Year", 2)).value
            shift_val = ws.cell(r, headers.get("Shift", 3)).value
            weekly_val = ws.cell(r, headers.get("Weekly hours", 4)).value
            earliest_val = ws.cell(r, headers.get("Earliest", 14)).value
            latest_val = ws.cell(r, headers.get("Latest", 15)).value

            adv = advisors.get(gid, {})
            groups_by_id[gid] = {
                "id": gid,
                "name": clean_ws(str(raw_name)),
                "year": int(float(year_val)) if year_val is not None else 1,
                "shift": clean_ws(str(shift_val)).lower() if shift_val else "morning",
                "weeklyHours": int(float(weekly_val)) if weekly_val is not None else 0,
                "earliest": normalize_single_time(earliest_val),
                "latest": normalize_single_time(latest_val),
                "advisor": adv.get("advisor"),
                "advisorRoom": adv.get("advisorRoom"),
            }
            expected_daily[gid] = {}
            for day_title in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]:
                if day_title in headers:
                    v = ws.cell(r, headers[day_title]).value
                    expected_daily[gid][day_title.upper()] = float(v) if v is not None else 0.0

    # Ensure deterministic order requested by project rules
    groups = [
        groups_by_id.get(
            gid,
            {
                "id": gid,
                "name": gid,
                "year": 1,
                "shift": "morning",
                "weeklyHours": 0,
                "earliest": None,
                "latest": None,
                "advisor": advisors.get(gid, {}).get("advisor"),
                "advisorRoom": advisors.get(gid, {}).get("advisorRoom"),
            },
        )
        for gid in TARGET_GROUPS
    ]
    return groups, expected_daily


def parse_satur_comments(wb: openpyxl.Workbook) -> dict[str, Any]:
    """Parse 'Satur_comments' sheet into structured metadata."""
    notes: list[str] = []
    saturday_online: list[dict[str, Any]] = []
    one_off: list[dict[str, Any]] = []

    if "Satur_comments" not in wb.sheetnames:
        return {"notes": notes, "saturdayOnlineSessions": saturday_online, "oneOffSessions": one_off}

    ws = wb["Satur_comments"]
    section = "sat"
    in_table = False

    for r in range(1, ws.max_row + 1):
        c1 = clean_ws(str(ws.cell(r, 1).value or ""))
        c2 = clean_ws(str(ws.cell(r, 2).value or ""))
        c3 = clean_ws(str(ws.cell(r, 3).value or ""))
        if not (c1 or c2 or c3):
            in_table = False
            continue

        if c1.upper().startswith("ONE-OFF SESSIONS"):
            section = "one_off"
            in_table = False
            notes.append(c1)
            continue

        if c1 == "Groups" and c2 == "Course":
            in_table = True
            continue

        if in_table and (c2 or c3):
            entry = {
                "groupsRaw": c1,
                "groupIds": extract_target_groups_from_text(c1),
                "course": c2,
                "details": c3,
            }
            if section == "sat":
                saturday_online.append(entry)
            else:
                one_off.append(entry)
        else:
            in_table = False
            notes.append(c1)

    return {
        "notes": notes,
        "saturdayOnlineSessions": saturday_online,
        "oneOffSessions": one_off,
    }


def extract_semester_title(wb: openpyxl.Workbook) -> str:
    """Extract semester header from MONDAY sheet."""
    ws = wb["MONDAY"]
    for r in range(1, 4):
        for c in range(1, 5):
            v = ws.cell(r, c).value
            if v and "SEMESTER" in str(v).upper():
                parts = [p.strip() for p in str(v).split("—") if p.strip()]
                return parts[-1] if parts else clean_ws(str(v))
    return "2026-2027 FALL SEMESTER"


def parse_room_table(
    ws: openpyxl.worksheet.worksheet.Worksheet,
    merges: dict[tuple[int, int], tuple[int, int, int, int]],
    room_header_row: int,
    room_col: int,
    min_tc: int,
    max_tc: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Parse bottom ROOM occupancy table for cross-checks and missing-room backfill."""
    entries: list[dict[str, Any]] = []
    target_mentions: list[dict[str, Any]] = []
    seen_rects: set[tuple[int, int, int, int]] = set()

    for r in range(room_header_row + 1, ws.max_row + 1):
        room_raw = ws.cell(r, room_col).value
        if not room_raw:
            continue
        room = normalize_room(str(room_raw))
        if not room or room.upper() == "ROOM":
            continue
        for c in range(min_tc, max_tc + 1):
            rect = merges.get((r, c), (r, c, r, c))
            if rect in seen_rects:
                continue
            seen_rects.add(rect)
            r1, c1, _r2, c2 = rect
            val = ws.cell(r1, c1).value
            if not val:
                continue
            text = clean_ws(str(val))
            if not text or "LUNCH" in text.upper():
                continue
            entries.append(
                {
                    "room": room,
                    "c1": c1,
                    "c2": c2,
                    "text": text,
                    "textLower": text.lower(),
                }
            )
            gids = extract_target_groups_from_text(text)
            if gids:
                target_mentions.append(
                    {
                        "room": room,
                        "c1": c1,
                        "c2": c2,
                        "groupIds": gids,
                        "text": text,
                    }
                )

    return entries, target_mentions


def lookup_room_from_table(
    room_entries: list[dict[str, Any]],
    c1: int,
    c2: int,
    subject: str,
    teacher_name: str | None,
) -> str | None:
    """Find room in the bottom ROOM table matching the same column span and lesson."""
    subj_low = subject.lower()
    teacher_last = (
        teacher_name.split()[-1].lower()
        if teacher_name and len(teacher_name.split()) > 1
        else (teacher_name or "").lower()
    )
    for entry in room_entries:
        if entry["c1"] == c1 and entry["c2"] == c2:
            tl = entry["textLower"]
            if subj_low in tl and (not teacher_last or teacher_last in tl):
                return entry["room"]
    return None


def classify_lesson_type(subject: str, has_star: bool, fill_rgb: str | None) -> str:
    """Determine lesson type: fixed, elective, advisor, or regular."""
    subj_low = subject.lower()
    if "advisor hour" in subj_low or (fill_rgb in COLOR_ADVISOR_YELLOW):
        return "advisor"
    if has_star or (fill_rgb in COLOR_FIXED_CREAM):
        return "fixed"
    if re.match(r"^(?:PE|DE)\s*\d*\s*:", subject, flags=re.IGNORECASE) or (
        fill_rgb in COLOR_ELECTIVE_PURPLE
    ):
        return "elective"
    return "regular"


def parse_lesson_cell(
    day: str,
    start_time: str,
    end_time: str,
    c1: int,
    c2: int,
    group_ids: list[str],
    raw_value: str,
    fill_rgb: str | None,
    hyperlink_url: str | None,
    cell_ref: str,
    room_entries: list[dict[str, Any]],
    registry: TeacherRegistry,
    disputed_cells: list[dict[str, str]],
    unrecognized_cells: list[dict[str, str]],
) -> list[dict[str, Any]]:
    """Parse one cell (possibly merged across groups/slots) into 1 or more lesson dicts."""
    lines = [clean_ws(line) for line in raw_value.splitlines() if clean_ws(line)]
    if not lines:
        return []

    first_line = lines[0]
    if "LUNCH" in first_line.upper() and len(lines) == 1:
        return []

    subject, has_star = normalize_subject(first_line)
    lesson_type = classify_lesson_type(subject, has_star, fill_rgb)
    rest_lines = lines[1:]
    lessons_out: list[dict[str, Any]] = []

    # Pattern A: Advisor hour ('Advisor hour\nB101\nMs.Zhazgul Alymbaeva')
    if lesson_type == "advisor":
        room: str | None = None
        teacher_raw: str | None = None
        for ln in rest_lines:
            maybe_room = normalize_room(ln)
            if maybe_room and TRAILING_ROOM_RE.fullmatch(clean_ws(ln)):
                room = maybe_room
            else:
                t_part, r_part = split_teacher_and_room(ln)
                teacher_raw = t_part or teacher_raw
                if r_part and not room:
                    room = r_part
        if not teacher_raw:
            unrecognized_cells.append(
                {
                    "sheet": day,
                    "cell": cell_ref,
                    "reason": "Advisor hour без имени преподавателя",
                    "raw": raw_value,
                }
            )
            return []
        t = registry.add_course(teacher_raw, subject)
        lessons_out.append(
            {
                "day": day,
                "startTime": start_time,
                "endTime": end_time,
                "subject": subject,
                "type": lesson_type,
                "groupIds": group_ids,
                "teacherId": t["id"],
                "teacherIds": [t["id"]],
                "teacherName": t["name"],
                "room": room,
                "isOnline": False,
                "notes": None,
            }
        )
        return lessons_out

    # Pattern B: Per-group split lines inside one merged block, e.g. Thursday English:
    # '(COMSE A) Ms. Aida Abibova B201'
    group_prefixed_lines = [
        ln for ln in rest_lines if re.match(r"^\(([^)]+)\)\s+(.+)$", ln)
    ]
    if group_prefixed_lines and len(group_prefixed_lines) == len(rest_lines):
        for ln in rest_lines:
            m = re.match(r"^\(([^)]+)\)\s+(.+)$", ln)
            assert m is not None
            gid = normalize_group_id(m.group(1), require_year=False)
            if not gid or gid not in group_ids:
                unrecognized_cells.append(
                    {
                        "sheet": day,
                        "cell": cell_ref,
                        "reason": f"Неизвестный код группы в строке: {m.group(1)!r}",
                        "raw": raw_value,
                    }
                )
                continue
            teacher_raw, room = split_teacher_and_room(m.group(2))
            t = registry.add_course(teacher_raw, subject)
            lessons_out.append(
                {
                    "day": day,
                    "startTime": start_time,
                    "endTime": end_time,
                    "subject": subject,
                    "type": lesson_type,
                    "groupIds": [gid],
                    "teacherId": t["id"],
                    "teacherIds": [t["id"]],
                    "teacherName": t["name"],
                    "room": room,
                    "isOnline": False,
                    "notes": None,
                }
            )
        return lessons_out

    # Pattern C: Slash-separated parallel stream list (Monday Russian language)
    if len(rest_lines) == 1 and "/" in rest_lines[0] and rest_lines[0].count("/") >= 2:
        parts = [p.strip() for p in rest_lines[0].split("/") if p.strip()]
        teachers: list[str] = []
        teacher_ids: list[str] = []
        subgroups: list[dict[str, Any]] = []
        rooms: list[str] = []
        stream_pairs: list[str] = []
        for p in parts:
            t_raw, r_part = split_teacher_and_room(p)
            if t_raw:
                t = registry.add_course(t_raw, subject)
                teachers.append(t["name"])
                if t["id"] not in teacher_ids:
                    teacher_ids.append(t["id"])
                subgroups.append(
                    {
                        "teacherId": t["id"],
                        "teacherName": t["name"],
                        "room": r_part or "",
                    }
                )
                if r_part:
                    rooms.append(r_part)
                    stream_pairs.append(f"{t['name']} ({r_part})")
                else:
                    stream_pairs.append(t["name"])
        disputed_cells.append(
            {
                "sheet": day,
                "cell": cell_ref,
                "kind": "Потоковая пара (несколько преподавателей/подгрупп)",
                "details": f"{subject} ({', '.join(group_ids)}): " + "; ".join(stream_pairs),
            }
        )
        lessons_out.append(
            {
                "day": day,
                "startTime": start_time,
                "endTime": end_time,
                "subject": subject,
                "type": lesson_type,
                "groupIds": group_ids,
                "teacherId": None,
                "teacherIds": teacher_ids,
                "teacherName": " / ".join(teachers) if teachers else None,
                "room": " / ".join(dict.fromkeys(rooms)) if rooms else None,
                "isOnline": False,
                "subgroups": subgroups,
                "notes": "Потоки/подгруппы: " + "; ".join(stream_pairs),
            }
        )
        return lessons_out

    # Pattern D & E: Multi-line parallel lecturers (Calculus I, Linear Algebra, Physical Education)
    if len(rest_lines) >= 2 and not (
        len(rest_lines) == 2 and rest_lines[1].lower() == "(web-based)"
    ):
        # Check if last line is a standalone shared room (e.g., Physical Education -> 'Sport Hall')
        shared_room: str | None = None
        lecturer_lines = list(rest_lines)
        last_clean = clean_ws(lecturer_lines[-1])
        if TRAILING_ROOM_RE.fullmatch(last_clean):
            shared_room = normalize_room(last_clean)
            lecturer_lines = lecturer_lines[:-1]

        teachers = []
        teacher_ids = []
        subgroups = []
        rooms = []
        stream_pairs = []
        for ln in lecturer_lines:
            t_raw, r_part = split_teacher_and_room(ln)
            if t_raw:
                t = registry.add_course(t_raw, subject)
                teachers.append(t["name"])
                if t["id"] not in teacher_ids:
                    teacher_ids.append(t["id"])
                eff_room = r_part or shared_room
                subgroups.append(
                    {
                        "teacherId": t["id"],
                        "teacherName": t["name"],
                        "room": eff_room or "",
                    }
                )
                if eff_room:
                    rooms.append(eff_room)
                if r_part:
                    stream_pairs.append(f"{t['name']} ({r_part})")
                else:
                    stream_pairs.append(t["name"])

        notes_parts = []
        if shared_room:
            notes_parts.append(f"Преподаватели: {', '.join(teachers)} ({shared_room})")
        else:
            notes_parts.append("Потоки: " + "; ".join(stream_pairs))
        if hyperlink_url:
            notes_parts.append(f"Meet: {hyperlink_url}")
            disputed_cells.append(
                {
                    "sheet": day,
                    "cell": cell_ref,
                    "kind": "Аудитория + ссылка Meet ('link')",
                    "details": f"{subject} ({', '.join(group_ids)}): указаны аудитории и ссылка {hyperlink_url}; оставлено isOnline=false.",
                }
            )
        else:
            disputed_cells.append(
                {
                    "sheet": day,
                    "cell": cell_ref,
                    "kind": "Потоковая пара (несколько преподавателей)",
                    "details": f"{subject} ({', '.join(group_ids)}): " + "; ".join(stream_pairs),
                }
            )

        lessons_out.append(
            {
                "day": day,
                "startTime": start_time,
                "endTime": end_time,
                "subject": subject,
                "type": lesson_type,
                "groupIds": group_ids,
                "teacherId": None,
                "teacherIds": teacher_ids,
                "teacherName": " / ".join(teachers) if teachers else None,
                "room": shared_room or (" / ".join(dict.fromkeys(rooms)) if rooms else None),
                "isOnline": False,
                "subgroups": subgroups,
                "notes": "; ".join(notes_parts),
            }
        )
        return lessons_out

    # Pattern F: Single-teacher standard lesson (possibly web-based, offline ONLY, or with hyperlink)
    joined_rest = " ".join(rest_lines)
    is_online = False
    note_items: list[str] = []

    if re.search(r"\(web-based\)", joined_rest, flags=re.IGNORECASE):
        is_online = True
        joined_rest = re.sub(r"\(web-based\)", "", joined_rest, flags=re.IGNORECASE).strip()
        note_items.append("Web-based (указано в расписании и Satur_comments)")

    m_offline = re.search(r"\(offline\s+ONLY\s+([^)]+)\)", joined_rest, flags=re.IGNORECASE)
    if m_offline:
        is_online = True
        offline_date = clean_ws(m_offline.group(1))
        joined_rest = re.sub(
            r"\(offline\s+ONLY\s+[^)]+\)", "", joined_rest, flags=re.IGNORECASE
        ).strip()
        note_items.append(
            f"Онлайн-курс; единственное очное занятие {offline_date} (согл. Satur_comments)"
        )
        disputed_cells.append(
            {
                "sheet": day,
                "cell": cell_ref,
                "kind": "Разовое очное занятие онлайн-курса (offline ONLY)",
                "details": (
                    f"{subject} ({', '.join(group_ids)}, {start_time}-{end_time}): "
                    f"отмечено 'offline ONLY {offline_date}', выставлено isOnline=true с указанием B205."
                ),
            }
        )

    teacher_raw, room = split_teacher_and_room(joined_rest)
    if not teacher_raw:
        unrecognized_cells.append(
            {
                "sheet": day,
                "cell": cell_ref,
                "reason": "Не удалось извлечь преподавателя",
                "raw": raw_value,
            }
        )
        return []

    t = registry.add_course(teacher_raw, subject)

    if not room and not is_online:
        room = lookup_room_from_table(room_entries, c1, c2, subject, t["name"])

    if hyperlink_url:
        note_items.append(f"Meet: {hyperlink_url}")
        disputed_cells.append(
            {
                "sheet": day,
                "cell": cell_ref,
                "kind": "Аудитория + ссылка Meet ('link')",
                "details": (
                    f"{subject} ({', '.join(group_ids)}, {t['name']}, {room or 'без ауд.'}): "
                    f"есть ссылка {hyperlink_url}; оставлено isOnline=false."
                ),
            }
        )

    if day == "SATURDAY" and not is_online:
        note_items.append(
            "ВНИМАНИЕ: стоит в сетке SATURDAY, но Satur_comments указывает отсутствие очных пар в субботу"
        )
        disputed_cells.append(
            {
                "sheet": day,
                "cell": cell_ref,
                "kind": "Конфликт SATURDAY с Satur_comments",
                "details": (
                    f"{subject} ({', '.join(group_ids)}, {start_time}-{end_time}, {t['name']}, "
                    f"ауд. {room or '?'}): присутствует в сетке SATURDAY (шапка листа '2024-2025 SPRING'), "
                    "хотя Satur_comments сообщает 'No classes are held on campus on Saturday'."
                ),
            }
        )

    lessons_out.append(
        {
            "day": day,
            "startTime": start_time,
            "endTime": end_time,
            "subject": subject,
            "type": lesson_type,
            "groupIds": group_ids,
            "teacherId": t["id"],
            "teacherIds": [t["id"]],
            "teacherName": t["name"],
            "room": room,
            "isOnline": is_online,
            "notes": "; ".join(note_items) if note_items else None,
        }
    )
    return lessons_out


def parse_day_sheets(
    wb: openpyxl.Workbook,
    registry: TeacherRegistry,
    disputed_cells: list[dict[str, str]],
    unrecognized_cells: list[dict[str, str]],
) -> tuple[list[dict[str, Any]], dict[tuple[str, str], float]]:
    """Parse MONDAY through SATURDAY sheets for the 4 target groups."""
    all_lessons: list[dict[str, Any]] = []
    # Track academic hours per (groupId, day) excluding advisor and one-off sessions
    actual_academic_hours: dict[tuple[str, str], float] = defaultdict(float)

    for day in DAY_SHEETS:
        if day not in wb.sheetnames:
            unrecognized_cells.append(
                {"sheet": day, "cell": "-", "reason": f"Отсутствует лист {day}", "raw": ""}
            )
            continue

        ws = wb[day]
        merges = build_merge_lookup(ws)

        # Find time header row (row 4 Mon-Fri, row 3 Sat)
        time_cols: dict[int, tuple[str, str]] = {}
        header_row = None
        for r in range(1, min(10, ws.max_row + 1)):
            found: dict[int, tuple[str, str]] = {}
            for c in range(1, ws.max_column + 1):
                tr = parse_time_range(ws.cell(r, c).value)
                if tr:
                    found[c] = tr
            if len(found) >= 5:
                header_row = r
                time_cols = found
                break

        if header_row is None:
            unrecognized_cells.append(
                {"sheet": day, "cell": "-", "reason": "Не найдена шапка времени", "raw": ""}
            )
            continue

        min_tc = min(time_cols)
        max_tc = max(time_cols)
        group_col = min_tc - 1  # col 1 Mon-Fri, col 2 Sat

        # Find ROOM section header row & target group rows
        room_header_row = ws.max_row + 1
        row_to_group: dict[int, str] = {}
        for r in range(header_row + 1, ws.max_row + 1):
            label = ws.cell(r, group_col).value
            if not label:
                continue
            lbl_str = clean_ws(str(label))
            if lbl_str.upper() == "ROOM":
                room_header_row = r
                break
            gid = normalize_group_id(lbl_str, require_year=True)
            if gid:
                row_to_group[r] = gid

        room_entries, room_target_mentions = parse_room_table(
            ws, merges, room_header_row, group_col, min_tc, max_tc
        )

        # Traverse target group rows + time columns via merged rectangles
        seen_rects: set[tuple[int, int, int, int]] = set()
        day_lessons: list[dict[str, Any]] = []

        for r in sorted(row_to_group):
            for c in range(min_tc, max_tc + 1):
                rect = merges.get((r, c), (r, c, r, c))
                if rect in seen_rects:
                    continue
                r1, c1, r2, c2 = rect
                # Collect target groups covered by this merged rectangle
                rect_groups = [
                    row_to_group[rr] for rr in range(r1, r2 + 1) if rr in row_to_group
                ]
                if not rect_groups:
                    continue
                seen_rects.add(rect)

                anchor = ws.cell(r1, c1)
                val = anchor.value
                if val is None or not str(val).strip():
                    continue
                raw_text = str(val).strip()
                if "LUNCH" in raw_text.upper() and len(raw_text.splitlines()) == 1:
                    continue

                if c1 not in time_cols or c2 not in time_cols:
                    unrecognized_cells.append(
                        {
                            "sheet": day,
                            "cell": anchor.coordinate,
                            "reason": "Ячейка выходит за границы колонок времени",
                            "raw": raw_text,
                        }
                    )
                    continue

                start_time = time_cols[c1][0]
                end_time = time_cols[c2][1]
                fill_rgb = get_fill_rgb(anchor)
                hl_url = anchor.hyperlink.target if anchor.hyperlink else None
                cell_ref = (
                    anchor.coordinate
                    if (r1 == r2 and c1 == c2)
                    else f"{anchor.coordinate}:{ws.cell(r2, c2).coordinate}"
                )

                rect_groups_sorted = sorted(
                    dict.fromkeys(rect_groups),
                    key=lambda g: TARGET_GROUP_DISPLAY_ORDER.index(g),
                )

                parsed_items = parse_lesson_cell(
                    day=day,
                    start_time=start_time,
                    end_time=end_time,
                    c1=c1,
                    c2=c2,
                    group_ids=rect_groups_sorted,
                    raw_value=raw_text,
                    fill_rgb=fill_rgb,
                    hyperlink_url=hl_url,
                    cell_ref=cell_ref,
                    room_entries=room_entries,
                    registry=registry,
                    disputed_cells=disputed_cells,
                    unrecognized_cells=unrecognized_cells,
                )

                col_hours = float(c2 - c1 + 1)
                for item in parsed_items:
                    day_lessons.append(item)
                    is_one_off = bool(
                        item.get("notes") and "единственное очное занятие" in item["notes"]
                    )
                    if item["type"] != "advisor" and not is_one_off:
                        for g in item["groupIds"]:
                            actual_academic_hours[(g, day)] += col_hours

        # Cross-check Room Table target mentions against parsed day_lessons
        for rm in room_target_mentions:
            if rm["c1"] not in time_cols or rm["c2"] not in time_cols:
                continue
            rm_start = time_cols[rm["c1"]][0]
            rm_end = time_cols[rm["c2"]][1]
            for gid in rm["groupIds"]:
                matched = any(
                    gid in ls["groupIds"]
                    and ls["startTime"] == rm_start
                    and ls["endTime"] == rm_end
                    for ls in day_lessons
                )
                if not matched:
                    disputed_cells.append(
                        {
                            "sheet": day,
                            "cell": f"ROOM ({rm['room']}, {rm_start}-{rm_end})",
                            "kind": "Несоответствие таблицы аудиторий (ROOM) и сетки групп",
                            "details": (
                                f"В нижней таблице аудиторий {rm['room']} ({rm_start}-{rm_end}) указана запись "
                                f"{rm['text']!r} для {gid}, но в основной сетке групп на это время пары нет."
                            ),
                        }
                    )

        all_lessons.extend(day_lessons)

    # Sort deterministically and assign stable IDs
    all_lessons.sort(
        key=lambda x: (
            DAY_ORDER.get(x["day"], 99),
            x["startTime"],
            TARGET_GROUP_DISPLAY_ORDER.index(x["groupIds"][0]),
            x["subject"].lower(),
        )
    )

    used_ids: dict[str, int] = defaultdict(int)
    for ls in all_lessons:
        groups_slug = "-".join(g.lower() for g in ls["groupIds"])
        base_id = (
            f"{ls['day'][:3].lower()}-"
            f"{ls['startTime'].replace(':', '')}-"
            f"{slugify(ls['subject'])}-{groups_slug}"
        )
        used_ids[base_id] += 1
        ls["id"] = base_id if used_ids[base_id] == 1 else f"{base_id}-{used_ids[base_id]}"

    return all_lessons, actual_academic_hours


def check_group_load_discrepancies(
    groups: list[dict[str, Any]],
    expected_daily: dict[str, dict[str, float]],
    actual_academic_hours: dict[tuple[str, str], float],
    disputed_cells: list[dict[str, str]],
) -> None:
    """Compare parsed Mon-Fri academic hours with Group Load sheet."""
    for grp in groups:
        gid = grp["id"]
        exp_map = expected_daily.get(gid, {})
        for day in ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]:
            exp = exp_map.get(day)
            if exp is None:
                continue
            act = actual_academic_hours.get((gid, day), 0.0)
            if abs(act - exp) > 0.01:
                disputed_cells.append(
                    {
                        "sheet": "Group Load",
                        "cell": f"{gid} / {day}",
                        "kind": "Расхождение часов с Group Load",
                        "details": (
                            f"Для {gid} в {day}: в листе Group Load указано {exp:.0f} ч., "
                            f"в основной сетке распарсено {act:.0f} ч."
                        ),
                    }
                )


def check_course_plan_discrepancies(
    wb: openpyxl.Workbook,
    lessons: list[dict[str, Any]],
    disputed_cells: list[dict[str, str]],
) -> None:
    """Cross-check Course Plan scheduled slots against parsed MONDAY-FRIDAY grid."""
    if "Course Plan" not in wb.sheetnames:
        return
    ws = wb["Course Plan"]
    day_abbr = {
        "mon": "MONDAY",
        "tue": "TUESDAY",
        "wed": "WEDNESDAY",
        "thu": "THURSDAY",
        "fri": "FRIDAY",
        "sat": "SATURDAY",
    }

    def canon_course(raw: str) -> str:
        s = raw.replace("★", "").strip()
        s = re.sub(r"\s*\(stream\s+\d+\s+of\s+\d+\)\s*$", "", s, flags=re.IGNORECASE)
        s = clean_ws(s)
        if s.lower() == "introduction to engineering and computer science":
            return "Introduction to Eng & CS"
        return s

    for r in range(2, ws.max_row + 1):
        slot_raw = ws.cell(r, 4).value
        groups_raw = ws.cell(r, 5).value
        sched_raw = ws.cell(r, 10).value
        if not slot_raw or not groups_raw or not sched_raw:
            continue
        gids = extract_target_groups_from_text(str(groups_raw))
        if not gids:
            continue
        course = canon_course(str(slot_raw))
        for item in [p.strip() for p in str(sched_raw).split(";") if p.strip()]:
            m = re.match(
                r"^(Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2}[.:]\d{2})\s*[-–—]\s*(\d{1,2}[.:]\d{2})$",
                item,
                flags=re.IGNORECASE,
            )
            if not m:
                continue
            day = day_abbr[m.group(1).lower()]
            cp_start = normalize_single_time(m.group(2))
            cp_end = normalize_single_time(m.group(3))
            for gid in gids:
                same_day = [
                    ls
                    for ls in lessons
                    if ls["day"] == day
                    and gid in ls["groupIds"]
                    and ls["subject"].lower() == course.lower()
                ]
                if not same_day:
                    disputed_cells.append(
                        {
                            "sheet": "Course Plan",
                            "cell": f"R{r} ({gid})",
                            "kind": "Расхождение с Course Plan (день)",
                            "details": (
                                f"Для {gid} предмет {course!r} в Course Plan указан на {day} "
                                f"{cp_start}-{cp_end}, но в сетке {day} этого предмета нет."
                            ),
                        }
                    )
                elif not any(
                    ls["startTime"] == cp_start and ls["endTime"] == cp_end
                    for ls in same_day
                ):
                    actual_times = ", ".join(
                        f"{ls['startTime']}-{ls['endTime']}" for ls in same_day
                    )
                    disputed_cells.append(
                        {
                            "sheet": "Course Plan",
                            "cell": f"R{r} ({gid})",
                            "kind": "Расхождение с Course Plan (время)",
                            "details": (
                                f"Для {gid} предмет {course!r} в Course Plan указан на {day} "
                                f"{cp_start}-{cp_end}, в сетке {day}: {actual_times}."
                            ),
                        }
                    )


def download_workbook(url: str, dest: Path) -> None:
    """Download the latest .xlsx workbook from Google Sheets."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "p5r-schedule-parser/1.0"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    if len(data) < 1024 or not data.startswith(b"PK"):
        raise RuntimeError(
            f"Скачанный файл не похож на корректный .xlsx (размер {len(data)} байт)"
        )
    dest.write_bytes(data)


def build_schedule_data(xlsx_path: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    """Parse workbook and return (schedule_json_payload, diagnostics)."""
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    registry = TeacherRegistry()
    disputed_cells: list[dict[str, str]] = []
    unrecognized_cells: list[dict[str, str]] = []

    # 1. Faculty & Office Hours first so canonical teacher names are registered
    parse_lecturer_load(wb, registry)
    oh_warnings: list[str] = []
    oh_entries = parse_office_hours(wb, registry, oh_warnings)
    for warn in oh_warnings:
        unrecognized_cells.append(
            {"sheet": "Office Hours Fall", "cell": "-", "reason": warn, "raw": ""}
        )
    advisors = parse_supervisors(wb, registry)

    # 2. Group metadata & Saturday/one-off notes
    groups, expected_daily = parse_group_load(wb, advisors)
    satur_meta = parse_satur_comments(wb)

    # 3. Lessons across MONDAY..SATURDAY
    lessons, actual_academic_hours = parse_day_sheets(
        wb, registry, disputed_cells, unrecognized_cells
    )

    # 4. Cross-check Group Load and Course Plan
    check_group_load_discrepancies(
        groups, expected_daily, actual_academic_hours, disputed_cells
    )
    check_course_plan_discrepancies(wb, lessons, disputed_cells)

    teachers = registry.export()

    payload = {
        "meta": {
            "semester": extract_semester_title(wb),
            "generatedAt": datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z"),
            "sourceUrl": SOURCE_URL,
            "saturdayNotes": satur_meta["notes"],
            "saturdayOnlineSessions": satur_meta["saturdayOnlineSessions"],
            "oneOffSessions": satur_meta["oneOffSessions"],
        },
        "groups": groups,
        "teachers": teachers,
        "lessons": lessons,
    }

    diagnostics = {
        "oh_entries": oh_entries,
        "fuzzy_matches": registry.fuzzy_matches,
        "disputed_cells": disputed_cells,
        "unrecognized_cells": unrecognized_cells,
        "actual_academic_hours": actual_academic_hours,
    }
    return payload, diagnostics


def print_report(payload: dict[str, Any], diag: dict[str, Any]) -> None:
    """Print human-readable verification report to stdout."""
    lessons = payload["lessons"]
    teachers = payload["teachers"]

    print("=" * 72)
    print("ОТЧЁТ ПРОВЕРКИ ПАРСИНГА РАСПИСАНИЯ")
    print("=" * 72)
    print(f"Семестр: {payload['meta']['semester']}")
    print(f"Всего уроков (событий в JSON): {len(lessons)}")
    print(f"Всего преподавателей в справочнике: {len(teachers)}")

    # 1. Lesson counts per group by day of week
    print("\n1. Количество пар по группам и дням недели:")
    header = ["Группа"] + [d[:3] for d in DAY_SHEETS] + ["Итого"]
    print(" | ".join(f"{h:9}" for h in header))
    print("-" * 76)
    for gid in TARGET_GROUP_DISPLAY_ORDER:
        counts = []
        total = 0
        for day in DAY_SHEETS:
            cnt = sum(1 for ls in lessons if ls["day"] == day and gid in ls["groupIds"])
            counts.append(str(cnt))
            total += cnt
        row = [gid] + counts + [str(total)]
        print(" | ".join(f"{cell:9}" for cell in row))

    # 2. Monday schedule for COMSE26A
    print("\n2. Расписание на ПОНЕДЕЛЬНИК для COMSE26A:")
    mon_a = [ls for ls in lessons if ls["day"] == "MONDAY" and "COMSE26A" in ls["groupIds"]]
    if not mon_a:
        print("  (пар не найдено)")
    else:
        for ls in mon_a:
            print(
                f"  - {ls['startTime']}-{ls['endTime']} | {ls['subject']} | "
                f"type={ls['type']} | teacher={ls['teacherName']} | room={ls['room']} | "
                f"online={ls['isOnline']} | notes={ls['notes']}"
            )

    # 3. Office hours & disputed/unrecognized cells
    with_oh = [t for t in teachers if t["officeHours"]]
    target_teacher_ids: set[str] = set()
    for ls in lessons:
        if ls.get("teacherId"):
            target_teacher_ids.add(ls["teacherId"])
        for tid in ls.get("teacherIds", []):
            target_teacher_ids.add(tid)
    # Also include individual teachers mentioned in stream lessons & group advisors
    target_teacher_names = {
        part.strip()
        for ls in lessons
        if ls["teacherName"]
        for part in ls["teacherName"].split("/")
    } | {
        g["advisor"] for g in payload["groups"] if g.get("advisor")
    }
    target_with_oh = [
        t
        for t in with_oh
        if t["id"] in target_teacher_ids or t["name"] in target_teacher_names
    ]
    print(
        f"\n3. Преподаватели с подтянутыми Office Hours: "
        f"{len(with_oh)} (из {len(teachers)} всего в таблице; "
        f"из них для целевых 4 групп: {len(target_with_oh)})"
    )
    print(f"   Разобрано слотов в листе 'Office Hours Fall': {diag['oh_entries']}")

    if diag["fuzzy_matches"]:
        print("\n   Нечёткие сопоставления имён (fuzzy):")
        for fm in diag["fuzzy_matches"]:
            print(f"     - {fm}")

    print(f"\n4. Нераспознанные ячейки: {len(diag['unrecognized_cells'])}")
    for uc in diag["unrecognized_cells"]:
        print(f"   - [{uc['sheet']} {uc['cell']}] {uc['reason']}: {uc['raw']!r}")

    print(f"\n5. Спорные/особые ячейки и примечания: {len(diag['disputed_cells'])}")
    for dc in diag["disputed_cells"]:
        print(f"   - [{dc['sheet']} {dc['cell']}] {dc['kind']}: {dc['details']}")


def semantic_schedule_snapshot(data: dict[str, Any]) -> dict[str, Any]:
    """Return comparable schedule payload excluding volatile meta.generatedAt."""
    meta = dict(data.get("meta") or {})
    meta.pop("generatedAt", None)
    return {
        "meta": meta,
        "groups": data.get("groups"),
        "teachers": data.get("teachers"),
        "lessons": data.get("lessons"),
    }


def has_semantic_changes(output_path: Path, new_payload: dict[str, Any]) -> bool:
    """Return True if output_path does not exist or meaningful schedule data changed."""
    if not output_path.exists():
        return True
    try:
        existing = json.loads(output_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return True
    if not isinstance(existing, dict):
        return True
    return semantic_schedule_snapshot(existing) != semantic_schedule_snapshot(
        new_payload
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Parse AIU Google Sheet (.xlsx) into public/data/schedule.json"
    )
    root_dir = Path(__file__).resolve().parent.parent
    parser.add_argument(
        "--download",
        action="store_true",
        help="Download fresh schedule.xlsx from Google Sheets before parsing",
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=root_dir / "data" / "schedule.xlsx",
        help="Path to input .xlsx file",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=root_dir / "public" / "data" / "schedule.json",
        help="Path to output schedule.json",
    )
    parser.add_argument(
        "--no-report",
        action="store_true",
        help="Suppress verification report output",
    )
    args = parser.parse_args()

    if args.download:
        print(f"Скачивание {EXPORT_URL} -> {args.input} ...")
        download_workbook(EXPORT_URL, args.input)
        print(f"Сохранено ({args.input.stat().st_size} байт).")

    if not args.input.exists():
        print(f"Ошибка: файл не найден: {args.input}", file=sys.stderr)
        return 1

    payload, diag = build_schedule_data(args.input)

    if not has_semantic_changes(args.output, payload):
        print("No schedule changes detected")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    if not args.no_report:
        print_report(payload, diag)

    return 0 if not diag["unrecognized_cells"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
