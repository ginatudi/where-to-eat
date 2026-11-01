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
function pad(n) { return String(n).padStart(2, "0"); }
function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function fmtT(t) { var a = t.split(":").map(Number); return ((a[0] % 12) || 12) + (a[1] ? ":" + pad(a[1]) : "") + (a[0] >= 12 ? "pm" : "am"); }
function fmtD(p) {
  var a = p.planDate.split("-").map(Number), d = new Date(a[0], a[1] - 1, a[2]);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + (p.planTime ? " " + fmtT(p.planTime) : "");
}
function byTime(a, b) { return (a.planDate + (a.planTime || "")).localeCompare(b.planDate + (b.planTime || "")); }
var now = new Date(), today = ymd(now);
var ws = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
var we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6);
var planned = places.filter(function (p) { return p.planDate && !p.visited; }).sort(byTime);
var week = planned.filter(function (p) { return p.planDate >= ymd(ws) && p.planDate <= ymd(we); });
var next = planned.filter(function (p) { return p.planDate >= today; })[0];
var wants = places.filter(function (p) { return !p.visited && p.want > 0; }).sort(function (a, b) { return b.want - a.want; });
var fam = config.widgetFamily || "medium";
var w = new ListWidget();
var g = new LinearGradient();
g.colors = [new Color("#05050f"), new Color("#17123f")];
g.locations = [0, 1];
w.backgroundGradient = g;
w.url = "https://ginatudi.github.io/where-to-eat/";
w.refreshAfterDate = new Date(Date.now() + 15 * 60000);
function line(text, size, color, bold) {
  var x = w.addText(text);
  x.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  x.textColor = new Color(color);
  x.lineLimit = 1;
  x.minimumScaleFactor = 0.6;
  return x;
}
line("WHERE TO EAT", 11, "#9b6bff", true);
w.addSpacer(4);
line(week.length + (week.length === 1 ? " dinner" : " dinners") + " this week", fam === "small" ? 17 : 22, "#ffffff", true);
w.addSpacer(6);
if (next) {
  line("Next up", 11, "#8c8cb3", false);
  line(next.name, 15, "#4c8dff", true);
  line(fmtD(next), 13, "#ffffff", false);
} else {
  line("Nothing planned yet", 14, "#8c8cb3", false);
}
if (fam !== "small" && wants.length) {
  w.addSpacer(8);
  line("Want most: " + wants[0].name + " (" + wants[0].want + "/5)", 12, "#9b6bff", false);
}
return w;
