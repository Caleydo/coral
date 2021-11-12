
Coral [![Phovea][phovea-image]][phovea-url] [![CircleCI](https://circleci.com/gh/Caleydo/coral.svg?style=svg)](https://circleci.com/gh/Caleydo/coral) <a href="https://coral.caleydoapp.org/"><img align="right" src="src/assets/favicon.svg" height="50"></img></a>
=====================

Coral is a web-based visual analysis tool for creating and characterizing cohorts.

Users can interactively create and refine cohorts, which can then be compared, characterized, and inspected down to the level of single items.
Coral visualizes the evolution of cohorts and also provides intuitive access to prevalence information.

Coral can be utilized to explore any type of cohort and sample set. Our focus, however, is on the analysis of genomic data from cancer patients.

🚀 You can try Coral yourself at: https://coral.caleydoapp.org/

![screenshot](media/screenshot.full.png?raw=true "Screenshot")

The application welcomes you with an overview of Coral and its features.

Learn more about Coral by reading the [paper](https://jku-vds-lab.at/publications/2021_bioinformatics_coral/) and its supplemental material with two cancer genomics case studies.  
For a quick overview of Coral, see our preview video:

[<img src="https://img.youtube.com/vi/vSd3a9J63wQ/maxresdefault.jpg" width=50% height=50%>](https://www.youtube.com/watch?v=vSd3a9J63wQ)

Feedback
------------

Your comments and feedback are welcome. Write an email to coral@caleydo.org and let us know what you think!  
If you have discovered an issue or have a feature suggestion, feel free to [create an issue on GitHub](https://github.com/Caleydo/coral/issues).

Future versions of Coral are planned in the milestones of the Github issue tracker. You can use the milestones to see what's currently planned for future releases.
Past releases and changelogs are available at https://github.com/Caleydo/coral/releases.


Installation
------------

Coral is based on the [Target Discovery Platform](https://github.com/datavisyn/tdp_core) and uses the [Phovea Server](https://github.com/phovea/phovea_server) to run the backend and multiple other Phovea plugins.

The [Coral Product repository](https://github.com/Caleydo/coral_product) describes all parts needed to set up a a running instance of Coral and is used to deploy the [stable](https://coral.caleydoapp.org/) and [daily development](https://coral-daily.caleydoapp.org/) builds.
Please refer to [the product repository](https://github.com/Caleydo/coral_product) for setup instructions.


Citing Coral
------------

Patrick Adelberger, Klaus Eckelt, Markus J. Bauer, Marc Streit, Christian Haslinger, Thomas Zichner  
**Coral: a web-based visual analysis tool for creating and characterizing cohorts**  
Bioinformatics, doi:10.1093/bioinformatics/btab695, 2021.  

```
@article{2021_bioinformatics_coral,
    title = {Coral: a web-based visual analysis tool for creating and characterizing cohorts},
    author = {Patrick Adelberger and Klaus Eckelt and Markus J. Bauer and Marc Streit and Christian Haslinger and Thomas Zichner},
    journal = {Bioinformatics},
    publisher = {Oxford University Press},
    doi = {10.1093/bioinformatics/btab695},
    year = {2021}
}
```


***

<a href="https://caleydo.org"><img src="http://caleydo.org/assets/images/logos/caleydo.svg" align="left" width="200px" hspace="10" vspace="6"></a>
This repository is part of **[Phovea](http://phovea.caleydo.org/)**, a platform for developing web-based visualization applications. For tutorials, API docs, and more information about the build and deployment process, see the [documentation page](http://phovea.caleydo.org).


[phovea-image]: https://img.shields.io/badge/Phovea-Application-1BA64E.svg
[phovea-url]: https://phovea.caleydo.org
[npm-image]: https://badge.fury.io/js/coral.svg
[npm-url]: https://npmjs.org/package/coral
