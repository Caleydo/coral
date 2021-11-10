import {HeaderNavigation, OrdinoFooter} from 'ordino';
import * as React from 'react';
import areaChart from '../assets/feature_icons/areaChart.png';
import barChart from '../assets/feature_icons/barChart.png';
import boxPlot from '../assets/feature_icons/boxPlot.png';
import densityPlot from '../assets/feature_icons/densityPlot.png';
import scatterPlot from '../assets/feature_icons/scatterPlot.png';
import survivalPlot from '../assets/feature_icons/survivalPlot.png';
import {FeatureCard} from './components/FeatureCard';
import intro from '../assets/welcome_tour/030_Workflow_Intro.svg';
import overview1 from '../assets/welcome_tour/100_Overview.svg';
import overview2 from '../assets/welcome_tour/110_Overview.svg';
import split1 from '../assets/welcome_tour/200_Split.svg';
import split2 from '../assets/welcome_tour/210_Split.svg';
import filter1 from '../assets/welcome_tour/300_Filter.svg';
import filter2 from '../assets/welcome_tour/310_Filter.svg';
import prevalence from '../assets/welcome_tour/400_Prevalence.svg';
import compare1 from '../assets/welcome_tour/500_Compare.svg';
import compare2 from '../assets/welcome_tour/510_Compare.svg';
import details from '../assets/welcome_tour/600_Details.svg';

export function FeaturesPage() {
  return (
    <>
      <HeaderNavigation bg="none"></HeaderNavigation>
      <div className="position-relative py-6">
        <div className="ordino-container">
          <div className="container pb-6 pt-4">

            <div className="row workflow-carousel text-center">
              <div className="col-12 offset-lg-1 col-lg-10">
                <div id="carousel-welcome" className="carousel slide carousel-fade" data-bs-slide="carousel" data-bs-interval="false">
                  {/* Indicators */}
                  <ol className="carousel-indicators">
                    <li data-bs-target="#carousel-welcome" data-bs-slide-to="0" className="active"></li>
                    <li data-bs-target="#carousel-welcome" data-bs-slide-to="1"></li>
                    <li data-bs-target="#carousel-welcome" data-bs-slide-to="2"></li>
                    <li data-bs-target="#carousel-welcome" data-bs-slide-to="3"></li>
                    <li data-bs-target="#carousel-welcome" data-bs-slide-to="4"></li>
                    <li data-bs-target="#carousel-welcome" data-bs-slide-to="5"></li>
                    <li data-bs-target="#carousel-welcome" data-bs-slide-to="6"></li>
                  </ol>
                  {/* Wrapper for slides */}
                  <div className="carousel-inner">
                    <div className="carousel-item active">
                      {/* each div.carousel-item is a slide in the slidehow */}
                      {/* svgs in assets folder are downloaded from Google Slides: https://docs.google.com/presentation/d/15ARPgYA7sdwJcQP_GU_Hoyzv9uWFEaIMt7nD6-ugJ5M/edit#slide=id.ga1541cc35f_0_330*/}
                      {/* 1.To animate the welcome page slides, some consist of multiple Google Slides */}
                      {/* animation is done by css, simply add mulitple svgs to the same div.item to animate through them */}
                      <img src={intro} />
                      <div className="carousel-caption"></div>
                    </div>
                    <div className="carousel-item">
                      <img src={overview1} />
                      <img src={overview2} />
                      <div className="carousel-caption"></div>
                    </div>
                    <div className="carousel-item">
                      <img src={split1} />
                      <img src={split2} />
                      <div className="carousel-caption"></div>
                    </div>
                    <div className="carousel-item">
                      <img src={filter1} />
                      <img src={filter2} />
                      <div className="carousel-caption"></div>
                    </div>
                    <div className="carousel-item">
                      <img src={prevalence} />
                      <div className="carousel-caption"></div>
                    </div>
                    <div className="carousel-item">
                      <img src={compare1} />
                      <img src={compare2} />
                      <div className="carousel-caption"></div>
                    </div>
                    <div className="carousel-item">
                      <img src={details} />
                      <div className="carousel-caption"></div>
                    </div>
                  </div>

                  {/* Controls */}
                  <button className="carousel-control-prev" type="button" data-bs-target="#carousel-welcome" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button className="carousel-control-next" type="button" data-bs-target="#carousel-welcome" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="row mt-6">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <h3 className="text-start d-flex align-items-center mb-3">Features</h3>
              </div>
            </div>
            {/* Onboarding */}
            <div className="row">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <h4 className="text-start d-flex align-items-center mb-3"><i className="me-2 ordino-icon-1 fas fa-chevron-circle-right" ></i> Onboarding</h4>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <p className="lead text-gray-600">
                  Coral offers onboarding tooltips to guide new users through the application. The tooltips indicate what elements represent and what roles they play in Coral.
                  A general workflow will be supported with these onboarding tooltips to explain the iterative workflow, cohort creation and how cohorts can be characterized.
                </p>
              </div>
            </div>


            {/* Cohort Tracking */}
            <div className="row mt-3">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <h4 className="text-start d-flex align-items-center mb-3"><i className="me-2 ordino-icon-1 fas fa-chevron-circle-right" ></i> Cohort Tracking</h4>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <p className="lead text-gray-600">
                  The <b>Cohort Evolution View</b> (upper panel) presents how all cohorts were generated as well as their relationships as a graph.
                  Operations and cohorts are encoded as nodes connected by edges to represent the analysis flow.
                  The first cohort includes all items of the loaded dataset and is created automatically.
                  When the user selects a cohort in the graph, it is assigned a color that is used consistently in all visualizations.
                </p>
              </div>
            </div>


            {/* Cohort Creation */}
            <div className="row mt-3">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <h4 className="text-start d-flex align-items-center mb-3"><i className="me-2 ordino-icon-1 fas fa-chevron-circle-right"></i> Cohort Creation</h4>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <p className="lead text-gray-600">
                  Selected cohorts are loaded into the <b>Action View</b> (lower panel), which allows users to perform cohort characterization and creation operations.
                  New cohorts created by these operations are also added to the graph, which results in an iterative cohort definition and analysis workflow.
                  The Action View is divided into three areas: the Input Area, the Operation Area, and the optional Output Area, which is shown if the operation results in new cohorts.
                  The Operation Area provides the several operations that can be applied to the input cohorts.
                </p>
                <h5>Filter &amp; Split</h5>
                <p className="lead text-gray-600">
                  The Filter &amp; Split operation is used to create cohorts from the loaded dataset.
                  Filtering works by selecting the values of interest to create a new cohort. In contrast, the Split operation can be used to divide a cohort into mulitple sub-cohorst.
                </p>
              </div>
            </div>


            {/* View */}
            <div className="row mt-3">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <h4 className="text-start d-flex align-items-center mb-3"><i className="me-2 ordino-icon-1 fas fa-chevron-circle-right"></i> View</h4>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <p className="lead text-gray-600">
                  The View operation is the main route to exploring the dataset and investigating how the values of one or more attributes are distributed across cohorts.
                </p>
                <p className="lead text-gray-600">
                  Coral offers different visualizations, based on the number and type of attributes:
                </p>
              </div>
            </div>
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3">
              <FeatureCard image={{file:barChart, altText:'Image for a bar chart.'}} title="Bar Chart" config={{numbAttr: 1,attribute: 'Categorical'}} >
                <p className="mb-0">
                  A categorical attribute will be shown with a bar chart, which shows the distribution of values for each category.
                  If more than one cohort is selected, a grouped bar chart will be shown.
                </p>
              </FeatureCard>
              <FeatureCard image={{file:densityPlot, altText:'Image for a desnity plot.'}} title="Density Plot" config={{numbAttr: 1,attribute: 'Quantitative'}} >
                <p className="mb-0">
                  A quantitative attribute will be displayed with a density plot and will superimpose the different curves for multiple selected cohorts.
                </p>
              </FeatureCard>
              <FeatureCard image={{file:survivalPlot, altText:'Image for a survival plot.'}} title="Kaplan-Meier/Survival Plot" config={{numbAttr: 1,attribute: 'Quantitative'}} >
                <p className="mb-0">
                  The survival plot is only used for quantitative attributes related to the survival, if multiple cohorts are selected the multiple curves will be superimposed.
                </p>
              </FeatureCard>
              <FeatureCard image={{file:boxPlot, altText:'Image for a box plot.'}} title="Box Plot" config={{numbAttr: 2,attribute: '1 Quantitative and 1 Categorical'}} >
                <p className="mb-0">
                  Selecting a categorical and a quantitative attribute will show a boxplot, with a box for each category.
                  For multiple cohorts a box plot with mutliple boxes for each category will be shown, each representing a cohort.
                </p>
              </FeatureCard>
              <FeatureCard image={{file:scatterPlot, altText:'Image for a scatterplot.'}} title="Scatterplot" config={{numbAttr: 2,attribute: '2 Quantitative'}} >
                <p className="mb-0">
                  A scatterplot will be used to display two quantitative attributes.
                  In case of multiple cohorts, all datapoints of each cohort will be plotted corresponding with the color of the cohort.
                </p>
              </FeatureCard>
              <FeatureCard image={{file:areaChart, altText:'Image for an area chart.'}} title="Area Chart" config={{numbAttr: 2,attribute: '2 Categorical'}}>
                <p className="mb-0">
                  Choosing two categorical attributes will result in an area chart.
                  For multiple cohorts each category combination will have an area representing one cohort.
                </p>
              </FeatureCard>
            </div>


            {/* Prevalence */}
            <div className="row mt-3">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <h4 className="text-start d-flex align-items-center mb-3"><i className="me-2 ordino-icon-1 fas fa-chevron-circle-right" ></i> Estimate the Prevalence</h4>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <p className="lead text-gray-600">
                  Prevalence is the proportion of items with a certain characteristic in a cohort. An exmaple would be the proportion of patients with a gene mutation among female Asian patients with NSCLC.
                  Coral provides a dedicated analysis view to assess prevalence estimates. After selecting the sample cohort with items that have the characteristic of interest,
                  the user can flexibly define the reference cohort by applying or skipping Filter &amp; Split operations used to create the sample cohort.
                  The cohorts’ sizes and the resulting prevalences are then displayed in a bar chart.
                </p>
              </div>
            </div>


            {/* Compare (TourDino) */}
            <div className="row mt-3">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <h4 className="text-start d-flex align-items-center mb-3"><i className="me-2 ordino-icon-1 fas fa-chevron-circle-right" ></i> Perform Basic Statistical Analyses</h4>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <p className="lead text-gray-600">
                  Seeking relationships and patterns in tabular data is a common data exploration task. To confirm hypotheses that are based on visual patterns observed during exploratory data analysis,
                  users need to be able to quickly compare data subsets, and get further information on the significance of the result and the statistical test applied.</p>
                <p className="lead text-gray-600">
                  The <b>Comparison</b> operation enables users who are not experts in statistics to verify generated hypotheses and confirm insights gained during the exploration of tabular data.
                  Concretely, it presents an overview of the statistical significance of various cohort comparisons. On demand, it shows further details, including the <b>test score</b>, a <b>textual description</b>, and a <b>detail visualization</b> explaining the results.
                </p>
              </div>
            </div>


            {/* Inspect (Taggle/LineUp) */}
            <div className="row mt-3">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <h4 className="text-start d-flex align-items-center mb-3"><i className="me-2 ordino-icon-1 fas fa-chevron-circle-right" ></i> Inspect the Items in a Cohort</h4>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                <p className="lead text-gray-600">
                  Coral uses the tabular visualization technique <a href="http://lineup.js.org/" target="_blank" rel="noopener">LineUp</a> for visualizing the items of the cohorts.
                  This makes it possible to identify outliers or to assess single data points.
                  <br />
                  Attributes can be selected to display their data in the table, and sort, filter, and group the data.
                </p>
              </div>
            </div>
          </div>
          <OrdinoFooter></OrdinoFooter>
        </div>
      </div>
    </>
  );
}
