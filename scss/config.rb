# Require any additional compass plugins here.

# Set this to the root of your project when deployed:
http_path = "/"
css_dir = "../deploy/files/css"
sass_dir = ""
images_dir = "../deploy/files/images"
javascripts_dir = "javascripts"

# You can select your preferred output style here (can be overridden via the command line):
output_style = :compressed
# or :nested or :compact or :compressed

# To enable relative paths to assets via compass helper functions. Uncomment:
relative_assets = true

# To disable debugging comments that display the original location of your selectors. Uncomment:
# line_comments = false


# If you prefer the indented syntax, you might want to regenerate this
# project again passing --syntax sass, or you can uncomment this:
# preferred_syntax = :sass
# and then run:
# sass-convert -R --from scss --to sass sass scss && rm -rf sass && mv scss sass

# Following line enables scss files in chrome
sass_options = {:debug_info => true}