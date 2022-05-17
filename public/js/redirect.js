/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
function showLoading() {
  document.body.style.cursor = 'wait';
  const div = document.createElement('div');
  div.innerHTML = 'Please wait...';
  div.classList.add('Loading');
  document.body.appendChild(div);
  return true;
}
$(window).on('onunload', () => {
  showLoading();
});
$(() => {
  showLoading();
  location.replace(`/config/popup${document.location.search}`);
});
