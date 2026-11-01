var URL_BASE = "https://firestore.googleapis.com/v1/projects/where-to-eat-70157/databases/(default)/documents/lists/eat-b0ae63bcf9083e11/places?pageSize=300&key=AIzaSyBWzATLrbDkh2JxsyOtKiVF_2-hQHUY1KI";
var res = await new Request(URL_BASE).loadJSON();
var places = (res.documents || []).map(function (d) {
  var o = {}, f = d.fields || {};
  Object.keys(f).forEach(function (k) {
    var v = f[k];
    o[k] = v.stringValue !== undefined ? v.stringValue : v.integerValue !== undefined ? Number(v.integerValue) : v.doubleValue !== undefined ? v.doubleValue : v.booleanValue !== undefined ? v.booleanValue : null;
  });
  return o;
});

// ---------- data ----------
function pad(n) { return String(n).padStart(2, "0"); }
function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function parseD(s) { var a = s.split("-").map(Number); return new Date(a[0], a[1] - 1, a[2]); }
function fmtT(t) { var a = t.split(":").map(Number); return ((a[0] % 12) || 12) + (a[1] ? ":" + pad(a[1]) : "") + (a[0] >= 12 ? "pm" : "am"); }
function byTime(a, b) { return (a.planDate + (a.planTime || "")).localeCompare(b.planDate + (b.planTime || "")); }
function dollars(n) { return n > 0 ? "$".repeat(Math.min(3, n)) : ""; }
var DAY3 = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
var DAY1 = ["S", "M", "T", "W", "T", "F", "S"];

var now = new Date(), today = ymd(now);
var ws = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
var we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6);
var planned = places.filter(function (p) { return p.planDate && !p.visited; }).sort(byTime);
var week = planned.filter(function (p) { return p.planDate >= ymd(ws) && p.planDate <= ymd(we); });
var upcoming = planned.filter(function (p) { return p.planDate >= today; });
var next = upcoming[0];
var toTry = places.filter(function (p) { return !p.visited; });
var been = places.filter(function (p) { return p.visited; });
var wantsAll = toTry.filter(function (p) { return p.want > 0; }).sort(function (a, b) { return b.want - a.want; });
var wantsOpen = wantsAll.filter(function (p) { return !p.planDate; });
var wants = wantsOpen.length ? wantsOpen : wantsAll;
var fam = config.widgetFamily || "medium";

// ---------- palette ----------
var BLUE = new Color("#4c8dff"), PURPLE = new Color("#9b6bff"), WHITE = new Color("#ffffff");
var DIM = new Color("#8c8cb3"), CARD = new Color("#1e1a52"), CARD2 = new Color("#14113a"), FAINT = new Color("#34306e");

// ---------- widget shell ----------
var w = new ListWidget();
var g = new LinearGradient();
g.colors = [new Color("#05050f"), new Color("#1a1245")];
g.locations = [0, 1];
w.backgroundGradient = g;
w.url = "https://ginatudi.github.io/where-to-eat/";
w.refreshAfterDate = new Date(Date.now() + 15 * 60000);
w.setPadding(fam === "small" ? 12 : 14, fam === "small" ? 12 : 16, fam === "small" ? 12 : 14, fam === "small" ? 12 : 16);

// ---------- helpers ----------
function hrow(parent) { var s = parent.addStack(); s.layoutHorizontally(); s.centerAlignContent(); return s; }
function vcol(parent) { var s = parent.addStack(); s.layoutVertically(); return s; }
function txt(parent, t, size, color, bold) {
  var x = parent.addText(String(t));
  x.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  x.textColor = color;
  x.lineLimit = 1;
  x.minimumScaleFactor = 0.6;
  return x;
}
function icon(parent, name, size, color) {
  var sf = SFSymbol.named(name);
  if (!sf) return null;
  var im = parent.addImage(sf.image);
  im.imageSize = new Size(size, size);
  im.tintColor = color;
  return im;
}
function header(compact) {
  var h = hrow(w);
  icon(h, "fork.knife", compact ? 11 : 13, PURPLE);
  h.addSpacer(5);
  txt(h, "WHERE TO EAT", compact ? 10 : 11, PURPLE, true);
  if (!compact) {
    h.addSpacer();
    txt(h, toTry.length + " to try", 11, WHITE, true);
    txt(h, "  ·  ", 11, DIM, false);
    txt(h, been.length + " been", 11, DIM, false);
  }
}
function bigCount(parent, size) {
  var r = hrow(parent);
  var num = txt(r, week.length, size, WHITE, true);
  num.minimumScaleFactor = 1;
  r.addSpacer(7);
  var c = vcol(r);
  txt(c, week.length === 1 ? "dinner" : "dinners", 13, BLUE, true);
  txt(c, "this week", 11, DIM, false);
  return r;
}
function weekStrip(parent, circle, showNums) {
  var r = hrow(parent);
  for (var i = 0; i < 7; i++) {
    var d = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i);
    var key = ymd(d);
    var has = week.some(function (p) { return p.planDate === key; });
    var isToday = key === today;
    var isPast = key < today;
    if (i > 0) r.addSpacer();
    var col = vcol(r);
    col.centerAlignContent();
    var lt = txt(col, DAY1[i], 9, isToday ? WHITE : DIM, isToday);
    lt.centerAlignText();
    col.addSpacer(3);
    var c = col.addStack();
    c.layoutHorizontally();
    c.centerAlignContent();
    c.size = new Size(circle, circle);
    c.cornerRadius = circle / 2;
    if (has) { c.backgroundColor = BLUE; }
    else if (isPast) { c.backgroundColor = CARD2; }
    else { c.backgroundColor = CARD; }
    if (isToday) { c.borderWidth = 2; c.borderColor = PURPLE; }
    if (showNums) {
      var nt = txt(c, d.getDate(), circle > 26 ? 12 : 10, has ? WHITE : (isPast ? FAINT : DIM), has || isToday);
      nt.centerAlignText();
      nt.minimumScaleFactor = 1;
    } else if (has) {
      icon(c, "fork.knife", circle * 0.55, WHITE);
    }
  }
  return r;
}
function dateChip(parent, p, big) {
  var d = parseD(p.planDate);
  var diff = Math.round((d - parseD(today)) / 86400000);
  var hot = diff <= 1;
  var chip = parent.addStack();
  chip.layoutVertically();
  chip.centerAlignContent();
  chip.size = new Size(big ? 42 : 38, big ? 38 : 34);
  chip.cornerRadius = 9;
  chip.backgroundColor = hot ? BLUE : CARD;
  var a = txt(chip, diff === 0 ? "TODAY" : DAY3[d.getDay()], diff === 0 ? 8 : 9, hot ? WHITE : DIM, true);
  a.centerAlignText();
  var b = txt(chip, d.getDate(), big ? 16 : 14, WHITE, true);
  b.centerAlignText();
  b.minimumScaleFactor = 1;
  return chip;
}
function subLine(p) {
  var parts = [];
  if (p.planTime) parts.push(fmtT(p.planTime));
  if (p.price) parts.push(dollars(p.price));
  return parts.join("  ·  ");
}
function planRow(parent, p) {
  var r = hrow(parent);
  dateChip(r, p, true);
  r.addSpacer(10);
  var c = vcol(r);
  txt(c, p.name, 14, WHITE, true);
  var s = subLine(p);
  if (s) txt(c, s, 11, DIM, false);
  r.addSpacer();
}
function pips(parent, n) {
  var r = hrow(parent);
  for (var i = 1; i <= 5; i++) {
    var dot = r.addStack();
    dot.size = new Size(7, 7);
    dot.cornerRadius = 3.5;
    dot.backgroundColor = i <= n ? PURPLE : FAINT;
    if (i < 5) r.addSpacer(3);
  }
}
function wantRow(parent, p) {
  var r = hrow(parent);
  var nm = txt(r, p.name, 13, WHITE, false);
  r.addSpacer();
  if (p.price) { txt(r, dollars(p.price), 11, DIM, false); r.addSpacer(8); }
  pips(r, p.want);
}
function label(t) { var l = txt(w, t, 10, DIM, true); return l; }
function empty(msg) {
  var r = hrow(w);
  icon(r, "calendar.badge.plus", 16, DIM);
  r.addSpacer(8);
  txt(r, msg, 13, DIM, false);
}

// ---------- layouts ----------
if (fam === "small") {
  header(true);
  w.addSpacer(6);
  bigCount(w, 40);
  w.addSpacer();
  weekStrip(w, 15, false);
  w.addSpacer(8);
  if (next) {
    var sr = hrow(w);
    txt(sr, next.name, 12, WHITE, true);
  } else {
    txt(w, "Nothing planned", 12, DIM, false);
  }
} else if (fam === "medium") {
  header(false);
  w.addSpacer(8);
  var top = hrow(w);
  bigCount(top, 38);
  top.addSpacer();
  if (next) {
    var card = top.addStack();
    card.layoutHorizontally();
    card.centerAlignContent();
    card.backgroundColor = CARD;
    card.cornerRadius = 12;
    card.setPadding(7, 8, 7, 12);
    dateChip(card, next, false);
    card.addSpacer(9);
    var ncol = vcol(card);
    txt(ncol, "NEXT UP", 8, PURPLE, true);
    var nn = txt(ncol, next.name, 14, WHITE, true);
    var ns = subLine(next);
    txt(ncol, ns || " ", 11, DIM, false);
  } else {
    empty("Plan a night out");
  }
  w.addSpacer();
  weekStrip(w, 25, true);
} else {
  header(false);
  w.addSpacer(10);
  var t2 = hrow(w);
  bigCount(t2, 44);
  w.addSpacer(12);
  weekStrip(w, 32, true);
  w.addSpacer(14);
  label("COMING UP");
  w.addSpacer(6);
  if (upcoming.length) {
    upcoming.slice(0, 3).forEach(function (p, i) {
      if (i) w.addSpacer(7);
      planRow(w, p);
    });
  } else {
    empty("Nothing planned yet");
  }
  w.addSpacer();
  if (wants.length) {
    label("WANT MOST");
    w.addSpacer(6);
    wants.slice(0, 3).forEach(function (p, i) {
      if (i) w.addSpacer(6);
      wantRow(w, p);
    });
  }
}
return w;
