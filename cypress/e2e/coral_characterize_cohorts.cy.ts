before(() =>
  Cypress.on('uncaught:exception', (err, runnable) => {
    return false;
  }),
);

describe(' coral test: characterize cohorts', () => {
  it('passes', () => {
    cy.visit('localhost:8080');
    cy.viewport(1920, 1080);
    cy.get('[data-testid="start-analysis-button"]').click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get('[data-testid="accept_genie_terms"]').check();
    cy.get('[data-testid="login_button"]').click();

    // Select dataset "CCLE in  CELLINES"
    cy.contains('CELLLINE').next().click();
    cy.get('.dropdown-menu').contains('CCLE').click();
    cy.get('.rectCohort').click();

    // Create Cohots to test  by tumortype

    cy.get('[data-testid="dual_button"]').click();
    cy.get('.search-bar-container').type('tumortype');
    cy.get('[data-optid="tumortype"]').click(); // categorical

    cy.get("path[aria-label*='melanoma']").click();
    cy.get("path[aria-label*='liver']").click();

    cy.get('[data-testid="filter_button"]').click();

    cy.get('#cookie-bar-button').click();
    // COOKIE BAR BUTTON

    // Add data to Cohort Evolution View
    cy.get('[data-testid="confirm_button"]').click();

    // Spilt by gender
    cy.get('.search-bar-container').type('gender');
    cy.get('[data-optid="gender"]').click(); // categorical
    cy.get('[data-testid="split_button"]').click();
    cy.get('[data-testid="confirm_button"]').click();

    // Test Prevalence
    cy.get('.task-title').click();
    cy.get('.prevalence > .task-icon').click();
    cy.get('.exclude-container > .prev-checkbox > .checkbox-indicator').click();

    cy.get('.prev-max-scale-label').eq(0).contains('1698');

    cy.get(':nth-child(2) > .prev-legends-tasks > .prev-all-creation > .fas').click();
    cy.get('.scale-ref-size').eq(0).contains('619');

    cy.get('.ref-task-option > .prev-checkbox').eq(0).click();
    cy.get('.scale-ref-size').eq(0).contains('34');
    cy.get('.task-title').click();

    // Inspect Items
    cy.get('.details > .task-icon').click();
    cy.get('.search-bar-container').type('gender');
    cy.get('[data-optid="gender"]').click();
    cy.get('.search-bar-container').type('egfr');

    cy.get('[data-optid="ENSG00000146648"]').click();
    cy.get('[data-optid="ENSG00000146648:tpm"]').click();
    // gene column in local workspace not created
    cy.get('.search-bar-container').type('tumortype');
    cy.get('[data-optid="tumortype"]').click();
    cy.get('.task-title').click();

    // Compare
    cy.get('.compare > .task-icon').click();
    cy.get('[data-optid="ENSG00000146648:tpm"] > .remove-x').click();
    cy.get('.search-bar-container').type('age');
    cy.get('[data-optid*="age"]').click();
  });
});
