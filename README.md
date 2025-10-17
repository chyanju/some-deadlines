# Some Deadlines

Adapted from [ai-deadlines](https://github.com/paperswithcode/ai-deadlines) with small glitches fixed. Now you can put it under website sub-folders.

## Quick Commands

```bash
# for deployment
# also uncomment GA in config
bundle exec jekyll build -d <target_directory> -b "https://sites.cs.ucsb.edu/~yanju/deadlines"
# e.g.
bundle exec jekyll build -d ./deadlines -b "https://sites.cs.ucsb.edu/~yanju/deadlines"
# e.g.
bundle exec jekyll build -d ./deadlines -b "https://chyanju.github.io/deadlines"
```

```bash
# local config
bundle config set path 'vendor/bundle'
bundle add csv
bundle add logger
bundle install

# for local testing
bundle exec jekyll serve -b ""
```
