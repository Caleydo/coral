describe('basic coral test', () => {
  it('passes', () => {
    cy.visit('localhost:8080');
    cy.viewport(1920, 1080);
    cy.get('[data-testid="start-analysis-button"]').click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get('[data-testid="accept_genie_terms"]').check();
    cy.get('[data-testid="login_button"]').click();

    // Select dataset "TCGA tumors in tissues"
    cy.contains('TISSUE').next().click();
    cy.get('.dropdown-menu').contains('tumors').click();
    cy.get('.rectCohort').click();

    // Test clear button
    cy.get('.floating-confirm:visible > .btn').click();

    // Reselect cohort
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get('.rectCohort').click();

    // Filter by tumortype
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    // cy.get('.layout_rect .rectCohort').eq(0).click().should('have.class', 'selected');

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    // problematic:
    // cy.get('.rectCohort').eq(1).click().should('have.class', 'selected');
    cy.get('[data-testid="dual_button"]').click();
    cy.get('.search-bar-container').type('tumortype');
    cy.get('[data-optid="tumortype"]').click(); // categorical
    cy.get('.search-bar-container').type('age');
    cy.get('[data-optid="age"]').click(); // numerical

    // Could not select a gene without getting error: "Uncaught TypeError: Cannot read properties of null (reading 'style')"
    // cy.get('.search-bar-container').type('tp53')
    // cy.get('[data-optid="ENSG00000141510"] > .option-text-ensemble').click()
    // cy.get('[data-optid="ENSG00000141510:tpm"]').click()
    cy.get('.remove-x').eq(1).click();

    cy.get("path[aria-label*='breast invasive carcinoma']").click();
    cy.get("path[aria-label*='skin cutaneous melanoma']").click();

    cy.get('[data-testid="filter_button"]').click();
    cy.get('[data-testid="split_button"]').click();
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

    // Delselect "Male" cohort in Cohort Evolution View
    cy.get('.layout_rect .rectCohort-label-first').eq(3).click();

    // Delselect "Null" cohort in Input Area
    // cy.get('.layout_rect .rectCohort-label-second').eq(2).click()

    // Deselect Gender Null
    cy.get('.data .rectCohort-label-second').eq(2).click();

    // Select  cohort with tumortypes in Cohort Evolution View
    cy.get('.layout_rect .rectCohort-label-first').eq(1).click();
    cy.get('.search-bar-container').type('age');
    cy.get('[data-optid="age"]').click(); // numerical

    cy.get('[data-testid="nav_tab_split"]').click();
    // cy.get('.nav > :nth-child(2) > .nav-link').click()
    cy.get('[data-testid="nav_tab_filter"]').click();
    cy.get('[data-testid="nav_tab_split"]').click();
    // cy.get('.mark-group.role-scope.splitmarks .g[transform="translate(465.5,0)"]')
    // cy.get('.mark-group.role-scope.splitmarks g[transform="translate(465.5,0)"]').realMouseDown({ position: 'center' }).realMouseMove(100, 0, { position: 'center' })
    // cy.get('g[transform="translate(465.5,0)"]').realMouseDown({ position: 'center' }).realMouseMove(100, 0, { position: 'center' })
    // cy.get('.mark-group.role-scope.splitmarks').siblings().realMouseDown({ position: 'center' }).realMouseMove(100, 0, { position: 'center' })
    // cy.get('.vis-container').realMouseDown({ position: 'center' }).realMouseMove(100, 0, { position: 'center' })
    cy.get('.mark-group.role-scope.layer_0_pathgroup').realMouseDown({ position: 'center' }).realMouseMove(100, 0, { position: 'center' });

    // cy.get('.sticky > .d-grid > .btn').click()
    cy.get('[data-testid="apply_button"]').click();

    // Change Density Plot
    cy.get('.fas.fa-ruler').click();
    cy.contains('Smoothed Counts').click();

    // 2 numerical values => filter in scatterplot
    cy.get('.search-bar-container').type('bmi');
    cy.get('[data-optid="bmi"]').click(); // numerical
    cy.get('.mark-symbol.role-mark.layer_0_marks').realMouseDown({ position: 'center' }).realMouseMove(100, 100, { position: 'center' });
    // cy.get('[data-testid="apply_button"]').click()
    cy.get('.sticky > .d-grid > .btn').click();
    cy.get('[data-testid="confirm_button"]').click();

    // Open Kaplan-Meier Plot
    cy.get('.search-bar-container').type('death');
    cy.get('[data-optid*="death"]').click();
    cy.get('.mark-group.role-scope.layer_0_pathgroup').realMouseDown({ position: 'center' }).realMouseMove(-10, -75, { position: 'center' });
    cy.get('[data-testid="apply_button"]').click();

    // Box plot selection
    cy.get('.search-bar-container').type('race');
    cy.get('[data-optid*="ra"]').click();
    // cy.get('.mark-group.role-scope.layer_0_pathgroup').realMouseDown({ position: 'center' }).realMouseMove(-10, -75, { position: 'center' })
    cy.get('.mark-group.role-scope.cell').realMouseDown({ position: 'center' }).realMouseMove(-100, -75, { position: 'center' });
    // cy.get('[data-testid="apply_button"]').click()
    cy.get('.sticky > .d-grid > .btn').click();

    /*
    cy.dataCy('aevidence-app-chemical_proteomics')
      .find('.overlay', { timeout: 40000 })
      .click(248, 3, { force: true })
      .should('be.visible')
      .realMouseUp()
      .realMouseDown({ position: 'center' })
      .realMouseMove(100, 0, { position: 'center' })
      .realMouseMove(300, 300, { position: 'center' })
      .realMouseUp({ position: 'center' });

    */
  });
});
