export function create(_loginMenu: HTMLElement, loginDialog: HTMLElement) {
  const LOCALSTORAGE_ACCEPT_GENIE_TERMS = 'coral_accept_genie_terms';

  const checkboxAcceptGenieTerms: HTMLInputElement = loginDialog.querySelector('#accept_genie_terms');
  const localStorageValue = localStorage.getItem(LOCALSTORAGE_ACCEPT_GENIE_TERMS);

  if (localStorageValue !== null) {
    // check the checkbox if it was checked before
    checkboxAcceptGenieTerms.checked = (localStorageValue === 'true');
  }

  checkboxAcceptGenieTerms.addEventListener('change', function() {
    localStorage.setItem(LOCALSTORAGE_ACCEPT_GENIE_TERMS, String(this.checked));
  });
}
