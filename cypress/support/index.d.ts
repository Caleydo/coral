declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to select DOM element by data-cy attribute.
     * @example cy.dataCy('greeting')
     */
    dataCy(value: string, options?: { timeout?: number }): Chainable<JQuery<HTMLElement>>;
  }
}
