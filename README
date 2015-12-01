GNU LibreJS --an add-on for GNU IceCat and Mozilla Firefox-- detects and
blocks nonfree nontrivial JavaScript while allowing its execution on
pages containing code that is either trivial and/or free.


Notes on working with the code
-------------------------------
## Running the addon ##
Download jpm, then do something like this in the LibreJS
directory:

    jpm run -b `which abrowser`

## Debugging ##
Uncomment lines 22 and 23 in lib/main.js to enable printing of
console.debug() statements.

## Adding new whitelisted libraries ##
* Edit data/script_libraries/script-libraries.json

## Releasing a new version ##
* Update version number in:
** configure.ac
** package.json
** doc/version.texi
** data/display_panel/content/display-panel.html
* Then run `make info` to build the docs with gendocs.sh
* `git commit` and `git tag 6.0.4`
* Export a tarball:
    git archive --format=tar.gz --prefix=librejs-6.0.4/ 6.0.4 >librejs-6.0.4.tar.gz
    mv librejs-6.0.4.tar.gz ~/releases/librejs-6.0.4/
* Make xpi file: jpm xpi; mv librejs.xpi librejs-6.0.4.xpi
* Upload to gnu servers, update gnu.org/s/librejs links
* Make announcement on info-gnu and savannah.gnu.org
* Update #librejs topic
