# Vercel build warnings

The screenshot shows a successful deployment. The warnings are non-fatal.

## npm `Unknown env config "cache-dir"`

This is typically caused by an environment variable such as `npm_config_cache_dir` or `NPM_CONFIG_CACHE_DIR` set in Vercel project/team settings, or a custom install command. In Vercel > Project > Settings > Environment Variables, remove that variable if present. Keep standard Install Command automatic. Check any repository .npmrc for `cache-dir` and remove it. Do not delete the regular npm cache setting `cache`.

## webpack.cache.PackFileCacheStrategy

Webpack skipped serializing a cache item. This is normally a performance/cache warning, not a failed build. It can occur in Next.js CSS processing and may recur. Avoid changing webpack internals solely to hide it. If the build succeeds and website works, no action required.

## Next steps

Commit source to GitHub and allow Vercel to redeploy. Verify scanner API, database and image uploads separately. Never commit secrets.
