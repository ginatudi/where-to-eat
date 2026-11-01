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
w.setPadding(12, 14, 12, 14);

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
  icon(h, "fork.knife.circle.fill", compact ? 18 : 22, PURPLE);
  h.addSpacer(6);
  txt(h, "Where to Eat", compact ? 12 : 14, WHITE, true);
  if (!compact) {
    h.addSpacer();
    txt(h, toTry.length + " to try", 11, DIM, false);
  }
}
function bigCount(parent, size) {
  var r = hrow(parent);
  var num = txt(r, week.length, size, WHITE, true);
  num.minimumScaleFactor = 1;
  r.addSpacer(6);
  var c = vcol(r);
  txt(c, week.length === 1 ? "dinner" : "dinners", 13, BLUE, true);
  txt(c, "this week", 11, DIM, false);
  return r;
}
// Text and outlines only (no filled shapes behind text) so it still reads in iOS tinted mode.
function weekStrip(parent, mini) {
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
    if (mini) {
      var dot = col.addStack();
      dot.size = new Size(11, 11);
      dot.cornerRadius = 5.5;
      if (has) { dot.backgroundColor = BLUE; }
      else { dot.borderWidth = 1.5; dot.borderColor = isToday ? PURPLE : FAINT; }
      continue;
    }
    var lt = txt(col, DAY1[i], 9, isToday ? PURPLE : DIM, true);
    lt.centerAlignText();
    col.addSpacer(2);
    var ring = col.addStack();
    ring.layoutHorizontally();
    ring.centerAlignContent();
    ring.size = new Size(26, 26);
    ring.cornerRadius = 13;
    if (isToday) { ring.borderWidth = 2; ring.borderColor = PURPLE; }
    var nt = txt(ring, d.getDate(), 13, has ? BLUE : (isPast ? FAINT : WHITE), has || isToday);
    nt.centerAlignText();
    nt.minimumScaleFactor = 1;
    col.addSpacer(2);
    var dt = col.addStack();
    dt.size = new Size(5, 5);
    dt.cornerRadius = 2.5;
    if (has) { dt.backgroundColor = BLUE; }
  }
  return r;
}
function subLine(p) {
  var parts = [];
  if (p.planTime) parts.push(fmtT(p.planTime));
  if (p.price) parts.push(dollars(p.price));
  return parts.join("  ·  ");
}
function dayLabel(p) {
  var d = parseD(p.planDate);
  var diff = Math.round((d - parseD(today)) / 86400000);
  if (diff === 0) return "TODAY";
  if (diff === 1) return "TMRW";
  return DAY3[d.getDay()] + " " + d.getDate();
}
function planRow(parent, p) {
  var r = hrow(parent);
  var l = vcol(r);
  l.size = new Size(46, 16);
  l.centerAlignContent();
  var a = txt(l, dayLabel(p), 11, BLUE, true);
  a.minimumScaleFactor = 0.8;
  txt(r, p.name, 14, WHITE, true);
  r.addSpacer();
  var s = subLine(p);
  if (s) txt(r, s, 11, DIM, false);
}
function pips(parent, n) {
  var r = hrow(parent);
  for (var i = 1; i <= 5; i++) {
    var dot = r.addStack();
    dot.size = new Size(8, 8);
    dot.cornerRadius = 4;
    if (i <= n) { dot.backgroundColor = PURPLE; }
    else { dot.borderWidth = 1; dot.borderColor = FAINT; }
    if (i < 5) r.addSpacer(3);
  }
}
function wantRow(parent, p) {
  var r = hrow(parent);
  txt(r, p.name, 13, WHITE, false);
  r.addSpacer();
  if (p.price) { txt(r, dollars(p.price), 11, DIM, false); r.addSpacer(8); }
  pips(r, p.want);
}
function label(t) { return txt(w, t, 10, PURPLE, true); }
function empty(parent, msg) {
  var r = hrow(parent);
  icon(r, "calendar.badge.plus", 15, DIM);
  r.addSpacer(6);
  txt(r, msg, 13, DIM, false);
}

// ---------- layouts ----------
if (fam === "small") {
  header(true);
  w.addSpacer(8);
  bigCount(w, 38);
  w.addSpacer();
  weekStrip(w, true);
  w.addSpacer(8);
  txt(w, next ? next.name : "Nothing planned", 12, next ? WHITE : DIM, !!next);
  if (next) txt(w, dayLabel(next) + (next.planTime ? " · " + fmtT(next.planTime) : ""), 10, DIM, false);
} else if (fam === "medium") {
  header(false);
  w.addSpacer(8);
  var top = hrow(w);
  bigCount(top, 36);
  top.addSpacer();
  if (next) {
    var nc = vcol(top);
    var t1 = txt(nc, "NEXT UP", 9, PURPLE, true);
    t1.rightAlignText();
    var t2 = txt(nc, next.name, 15, WHITE, true);
    t2.rightAlignText();
    var t3 = txt(nc, dayLabel(next) + (subLine(next) ? "  ·  " + subLine(next) : ""), 11, DIM, false);
    t3.rightAlignText();
  } else {
    empty(top, "Plan a night out");
  }
  w.addSpacer();
  weekStrip(w, false);
} else {
  header(false);
  w.addSpacer(8);
  bigCount(w, 40);
  w.addSpacer(10);
  weekStrip(w, false);
  w.addSpacer(12);
  label("COMING UP");
  w.addSpacer(5);
  if (upcoming.length) {
    upcoming.slice(0, 3).forEach(function (p, i) {
      if (i) w.addSpacer(6);
      planRow(w, p);
    });
  } else {
    empty(w, "Nothing planned yet");
  }
  w.addSpacer();
  if (wants.length) {
    label("WANT MOST");
    w.addSpacer(5);
    wants.slice(0, 3).forEach(function (p, i) {
      if (i) w.addSpacer(5);
      wantRow(w, p);
    });
  }
}
return w;
