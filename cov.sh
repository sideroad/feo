#!/bin/sh

rm -Rf lib-cov cov/coverage.html
jscoverage lib lib-cov
YOUR_LIBRARY_NAME_COV=1 mocha -R html-cov > cov/coverage.html
open cov/coverage.html
