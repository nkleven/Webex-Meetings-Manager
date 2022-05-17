/* eslint-disable object-shorthand */
/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
$(() => {
  $('#results').DataTable({
    dom: 'Blfrtip',
    pageLength: 25,
    buttons: [
      {
        extend: 'copy',
        text: 'Copy to Clipboard',
      },
      {
        extend: 'csv',
        text: 'Export Data to CSV',
      },
    ],
    rowCallback: function (row, data, index) {
      const allData = this.api().column(0).data().toArray();
      if (allData.indexOf(data[0]) !== allData.lastIndexOf(data[0])) {
        $('th:eq(0)', row).css('background-color', 'lightpink');
      }
    },
  });
});
