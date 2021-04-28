// compare:
// * Demo: https://atomiks.github.io/tippyjs/
// * all props: https://atomiks.github.io/tippyjs/v6/all-props/
export const CONFIG_ONBOARDING = {
    defaultSettings: {
        animation: 'shift-toward',
        inertia: true,
        theme: 'light-border',
        delay: 500,
        allowHTML: true
    },
    tooltips: {
        dataset: {
            placement: 'bottom',
            content: 'Start by selecting a dataset for your analysis.'
        },
        rootCohort: {
            placement: 'bottom-start',
            content: `
        <p>
          Selecting a dataset created your first cohort, containing all items of this dataset.
          The cohort's size is represented by the bar at the bottom.
        </p>
        <p>Click the cohort to select it for use.</p>
      `,
            maxWidth: 250
        },
        input: {
            placement: 'top',
            content: `<p>
        All selected cohorts are colored and listed here.
        Click a cohort again to deselect, or hit the Clear button below to remove all.
      </p>
      <p>Continue by selecting one of the operations on the right.</p>`,
        },
        output: {
            placement: 'top',
            content: `<p>
        You now see a preview of the generated output cohorts.
        <!--Changes in the distribution of used data are shown by columns added to the input and output side. -->
      </p><p>
        Adding the cohorts to the cohort evolution graph confirms the operation.
        You may also adjust the parameters or clear the output completely.
      </p>`,
        },
        filter: {
            placement: 'left-start',
            content: `
        In this operation, cohorts can be
        <ul class="fa-ul">
          <li>
            <i class="fa-li fas fa-filter" aria-hidden="true"></i>
            Filtered
          </li>
          <li>
            <i class="fa-li fas fa-share-alt" aria-hidden="true"></i>
            Split
          </li>
          <li>
            <i class="fa-li fas fa-chart-bar" aria-hidden="true"></i>
            Or simply viewed
          </li>
        </ul>
        <p>You can add and remove attributes and cohorts at any time. The visualization is updated based on the type and number of attributes.</p>
        <p>The color assigned to the cohorts upon selection also encodes the cohorts in the visualization.</p>
      `,
        },
        details: {
            placement: 'left-start',
            content: `
        <p>
          Inspect which items are in your cohorts. Add attributes using the search bar to see the individual values.
        </p>
        <p>
          The items can also be sorted, grouped, and filtered.<br>
          You can add and remove attributes and cohorts at any time. The list will then automatically update.
        </p>
        This operation cannot create output cohorts and therefore takes up their space.
      `,
        },
        compare: {
            placement: 'left-start',
            content: `
        <p>
          This operation statistically compares all selected cohorts.
          The attributes for the comparison are specified in the search bar.
        </p>
        <p>
          The generated table shows the p-values of the comparisons. Non-significant results are only shown on hover.
          Click a value for details about the comparison.
        </p>
        This operation cannot create output cohorts and therefore takes up their space.
      `,
        },
        prevalence: {
            placement: 'left-start',
            content: `
        <p>
          Determine the prevalence of the selected cohorts.<br>
          The reference does not have to be a cohort from the graph, but can be dynamically specified for each cohort by selecting from the filters used.
        </p>
        This operation cannot create output cohorts and therefore takes up their space.
      `,
        },
        firstOutputCohort: {
            placement: 'right',
            content: `
        <p>
          Your output cohorts are now the new input cohorts.
        </p>
        <p>Click a cohort to toggle its selection. To directly select only a single cohort, double-click it.</p>
      `,
            maxWidth: 250,
            onHidden: (instance) => instance.destroy() // auto remove after first click
        },
    }
};
//# sourceMappingURL=onboarding.js.map