// Get subjects from URL/Cache
var url = new URL(window.location);
subs = url.searchParams.get("sub");
if (subs == undefined) {
  subs = store.get("{{site.github_repo}}-subs");
} else {
  subs = subs.toUpperCase().split(",");
}

// Apply selections
if (subs == undefined) {
  subs = all_subs;
}
$("#subject-select").multiselect("select", subs);
update_filtering({ subs: subs, all_subs: all_subs });
