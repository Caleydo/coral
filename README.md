
Coral [![Phovea][phovea-image]][phovea-url] [![CircleCI](https://circleci.com/gh/Caleydo/coral.svg?style=svg&circle-token=fdba4d201b4b9eb707b8b155340aae1d23c74fdf)](https://circleci.com/gh/Caleydo/coral) [![Dependency Status][daviddm-image]][daviddm-url]
=====================

Coral is a web-based visual analysis tool for creating and characterizing cohorts.

Users can interactively create and refine cohorts, which can then be compared, characterized, and inspected down to the level of single items.
Coral visualizes the evolution of cohorts and also provides intuitive access to prevalence information.

Coral can be utilized to explore any type of cohort and sample set. Our focus, however, is on the analysis of genomic data from cancer patients.

![screenshot](media/screenshot.full.png?raw=true "Screenshot")

For a quick overview of Coral, see our preview video (TODO), or take a look into the preprint (TODO) and its supplemental material (TODO) with two cancer genomics case studies.


Installation
------------

Coral is based on the [Target Discovery Platform](https://github.com/datavisyn/tdp_core) and uses the [Phovea Server](https://github.com/phovea/phovea_server) to run the backend and multiple other Phovea plugins.

The [Coral Product repository](https://github.com/Caleydo/coral_product) describes all parts needed to set up a a running instance of Coral and is used to deploy the two public Coral version for 
* Stable releases: https://coral.caleydoapp.org/
* Daily development builds: https://coral-daily.caleydoapp.org/

Please refer to [the product repository](https://github.com/Caleydo/coral_product) for setup instructions.


***

<a href="https://caleydo.org"><img src="http://caleydo.org/assets/images/logos/caleydo.svg" align="left" width="200px" hspace="10" vspace="6"></a>
This repository is part of **[Phovea](http://phovea.caleydo.org/)**, a platform for developing web-based visualization applications. For tutorials, API docs, and more information about the build and deployment process, see the [documentation page](http://phovea.caleydo.org).


[phovea-image]: https://img.shields.io/badge/Phovea-Application-1BA64E.svg
[phovea-url]: https://phovea.caleydo.org
[npm-image]: https://badge.fury.io/js/coral.svg
[npm-url]: https://npmjs.org/package/coral
[daviddm-image]: https://david-dm.org/Caleydo/coral/status.svg
[daviddm-url]: https://david-dm.org/Caleydo/coral
