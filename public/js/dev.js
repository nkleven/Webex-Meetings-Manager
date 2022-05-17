/* eslint-disable no-undef */
$(() => {
  const nodeEnv = $('#nodeEnv').val();
  const betaSite = $('#betaSite').val();
  if (nodeEnv !== 'production') {
    $('#Banner').css({
      background: 'lightgreen',
    });
  }
  if (betaSite === 'true') {
    $('#Banner').css({
      background: 'lightskyblue',
    });
    if ($('#betaPopup').length) {
      $('#betaPopup').dialog({
        modal: true,
        width: 500,
        buttons: {
          Proceed: () => {
            $('#betaPopup').dialog('close');
          },
        },
      }).prev('.ui-dialog-titlebar').css('background', 'lightskyblue');
      // $('.ui-widget-overlay').on('click', () => {
      //   $('#betaPopup').dialog('close');
      // });
    }
  }
});
