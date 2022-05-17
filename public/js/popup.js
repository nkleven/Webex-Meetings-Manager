/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
$(() => {
  function formatAccount(account) {
    if (!account.id) {
      return account.text;
    }

    const $container = $(
      `<div class='select2-result-account clearfix'>
        <div class='select2-result-account__title'>${account.text}</div>
        <div class='select2-result-account__id'>${account.id} (${account.status})</div>
      </div>`,
    );

    return $container;
  }
  // https://anil.io/blog/javascript/javascript-popup-vertical-horizontal-center-dual-screen/
  function loadWindow(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    // eslint-disable-next-line no-nested-ternary
    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : screen.width;
    // eslint-disable-next-line no-nested-ternary
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : screen.height;

    const left = ((width / 2) - (w / 2)) + dualScreenLeft;
    const top = ((height / 2) - (h / 2)) + dualScreenTop;
    window.open(url, title, `scrollbars=yes, width=${w}, height=${h}, top=${top}, left=${left}`);
  }
  $('#close').on('click', () => {
    window.close();
  });
  $('#closeReload').on('click', () => {
    window.opener.location.reload(true);
    window.close();
  });
  $('#results').DataTable({
    dom: 'Blfrtip',
    pageLength: 25,
  });
  // ISSUE POPUP
  $('#issueComment').on('input', () => {
    let val = $('#issueComment').val();
    val = val.replace(/[^a-zA-Z0-9-_\s\n.;:,?"'<>@/]/g, '');
    val = val.trimStart();
    $('#issueComment').val(val);
  });
  $('#issueTime').on('input', () => {
    let val = $('#issueTime').val();
    val = val.replace(/[^0-9hm.\s]/g, '');
    val = val.replace(/^(.*)\s\s(.*)$/g, '$1 $2');
    val = val.trimStart();
    $('#issueTime').val(val);
  });
  // TRANSITION POPUP
  if ($('#resolution').length) {
    $('#resolution').hide();
  }
  if ($('#outcome').length) {
    $('#outcome').hide();
  }
  if ($('#holdReason').length) {
    $('#holdReason').hide();
  }
  if ($('#timeSpent').length) {
    $('#timeSpent').hide();
  }
  $('#transitionResolution').select2({
    minimumResultsForSearch: -1,
  });
  $('#transitionSelect').select2({
    minimumResultsForSearch: -1,
    placeholder: 'Select Transition...',
    // https://www.gyrocode.com/articles/predefined-options-for-select2-control-using-remote-data-source/
    dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    defaultResults: $.map($('#transitionSelect option'), (option) => {
      const newOption = {
        id: option.value,
        text: option.text,
      };
      if (option.attributes.fields) {
        newOption.fields = option.attributes.fields.value;
      }
      return newOption;
    }),
  });
  $('#transitionSelect').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#transitionSelect').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#transitionSelect').on('select2:clear', () => {
    // Clear All
    $('#resolution, #outcome, #holdReason, #timeSpent').hide();
    $('#transitionOutcome, #transitionHoldReason, #transitionTimeSpent').prop('disabled', true);
    $('#transitionComment, #transitionHoldReason').removeAttr('required');
    $('#transitionComment').attr('placeholder', '(Optional) Issue Comment...');
  });
  $('#transitionSelect').on('select2:select', (e) => {
    // Clear and Repopulate
    $('#resolution, #outcome, #holdReason').hide();
    $('#transitionOutcome, #transitionHoldReason, #transitionTimeSpent').prop('disabled', true);
    $('#transitionComment, #transitionHoldReason').removeAttr('required');
    $('#transitionComment').attr('placeholder', '(Optional) Issue Comment...');
    $('#transitionResolution').html('').trigger('change');
    if (e.params.data.fields && e.params.data.fields.match(/^{.*}$/)) {
      const fields = JSON.parse(e.params.data.fields);
      if (fields.resolution) {
        $('#resolution').show();
        fields.resolution.allowedValues.forEach((item) => {
          const data = {
            id: item.id,
            text: item.name,
          };
          const newOption = new Option(data.text, data.id, false, false);
          $('#transitionResolution').append(newOption).trigger('change');
        });
      }
      if (fields.outcome) {
        $('#outcome').show();
        $('#transitionOutcome').prop('disabled', false);
        $('#transitionOutcome').attr('required', '');
        $('#timeSpent').show();
        $('#transitionTimeSpent').prop('disabled', false);
      }
      if (fields.holdReason) {
        $('#holdReason').show();
        $('#transitionHoldReason').prop('disabled', false);
        $('#transitionHoldReason').attr('required', '');
        $('#transitionComment').attr('placeholder', '(Required) Issue Comment...');
        $('#transitionComment').attr('required', '');
      }
    }
  });
  $('#transitionTimeSpent').on('input', () => {
    let val = $('#transitionTimeSpent').val();
    val = val.replace(/[^0-9hm.\s]/g, '');
    val = val.replace(/^(.*)\s\s(.*)$/g, '$1 $2');
    val = val.trimStart();
    $('#transitionTimeSpent').val(val);
  });
  // SUBTASK POPUP
  $('#subtaskSelect').on('select2:clear', () => {
    // Clear All
    $('#subtaskTitle, #subtaskDescription').val(null).trigger('change');
    $('#subtaskComponents').html('').trigger('change');
  });
  $('#subtaskSelect').on('select2:select', (e) => {
    // Clear Subtask and Delete
    $('#subtaskTitle').val(e.params.data.text);
    $('#subtaskDescription').val(e.params.data.description);
    $('#subtaskComponents').html('').trigger('change');
    // Populate Subtask Components
    if (e.params.data.components) {
      if (typeof e.params.data.components === 'string') {
        e.params.data.components = JSON.parse(e.params.data.components);
      }
      e.params.data.components.forEach((componentId) => {
        $.ajax({
          type: 'GET',
          url: `/config/ajax?search=${componentId}&type=componentId`,
        }).then((component) => {
          const option = new Option(component.text, component.id, true, true);
          $('#subtaskComponents').append(option).trigger('change');
        });
      });
    }
  });
  $('#subtaskSelect').select2({
    ajax: {
      url: '/config/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'subtask',
        };
        return query;
      },
    },
    // minimumResultsForSearch: -1,
    placeholder: 'Select/Search or Create New below...',
    minimumInputLength: 2,
    // https://www.gyrocode.com/articles/predefined-options-for-select2-control-using-remote-data-source/
    dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    defaultResults: $.map($('#subtaskSelect option'), (option) => {
      const newOption = {
        id: option.value,
        text: option.text,
      };
      if (option.attributes.components) {
        newOption.components = option.attributes.components.value;
      }
      if (option.attributes.description) {
        newOption.description = option.attributes.description.value;
      }
      return newOption;
    }),
    allowClear: true,
  });
  $('#subtaskComponents').select2({
    ajax: {
      url: '/config/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'components',
        };
        return query;
      },
    },
    // minimumResultsForSearch: -1,
    placeholder: '(Optional) Subtask Components...',
    minimumInputLength: 2,
    // https://www.gyrocode.com/articles/predefined-options-for-select2-control-using-remote-data-source/
    // dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    // defaultResults: $.map($('#subtaskComponents option'), (option) => {
    //   const newOption = {
    //     id: option.value,
    //     text: option.text,
    //   };
    //   return newOption;
    // }),
    allowClear: true,
  });
  $('#subtaskTitle').on('input', () => {
    let val = $('#subtaskTitle').val();
    val = val.replace(/[^a-zA-Z0-9-_\s]/g, '');
    val = val.replace(/^(.*)\s\s(.*)$/g, '$1 $2');
    val = val.trimStart();
    $('#subtaskTitle').val(val);
  });
  $('#subtaskDescription').on('input', () => {
    let val = $('#subtaskDescription').val();
    val = val.replace(/[^a-zA-Z0-9-_\s\n.;:,?"'<>@/]/g, '');
    val = val.trimStart();
    $('#subtaskDescription').val(val);
  });
  $('#subtaskSelect, #subtaskComponents').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#subtaskSelect, #subtaskComponents').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#subtaskList').on('click', (e) => {
    const parentId = e.target.attributes.parent.value;
    loadWindow(`/config/popup?type=subtaskList&parentId=${parentId}`, 'Pop_Window', 1300, 500);
    return false;
  });
  // EPIC POPUP
  $('#epicSelect').select2({
    ajax: {
      url: '/config/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'epic',
        };
        return query;
      },
    },
    placeholder: 'Search for Existing EPIC...',
    minimumInputLength: 2,
    templateResult: formatAccount,
    // https://www.gyrocode.com/articles/predefined-options-for-select2-control-using-remote-data-source/
    dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    defaultResults: $.map($('#epicSelect option'), (option) => {
      const newOption = {
        id: option.value,
        text: option.text,
      };
      return newOption;
    }),
    allowClear: true,
  });
  $('#epicSelect, #theatre').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#epicSelect, #theatre').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#theatre').select2({
    minimumResultsForSearch: -1,
    placeholder: '(Required) Select Account Theatre...',
    allowClear: true,
  });
  // LOGO POPUP
  if ($('#logoDiv').length) {
    $('#logoDiv').hide();
  }
  $('#imageSelect').on('select2:clear', () => {
    // Clear All
    $('#logoDiv').hide();
  });
  $('#imageSelect').on('select2:select', (e) => {
    $('#imageUpload').val('').trigger('change');
    const attachmentUrl = e.params.data.url;
    if (e.params.data.id === 'blank') {
      return;
    }
    showLoading();
    $.ajax({
      type: 'GET',
      url: `/config/ajax?search=${attachmentUrl}&type=attachmentUrl`,
    }).then((imageData) => {
      $('#newLogo').attr('src', imageData);
      $('#logoDiv').show();
      hideLoading();
    });
  });
  $('#imageSelect').select2({
    minimumResultsForSearch: -1,
    placeholder: 'Select an Existing Attachment',
    // https://www.gyrocode.com/articles/predefined-options-for-select2-control-using-remote-data-source/
    dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    defaultResults: $.map($('#imageSelect option'), (option) => {
      const newOption = {
        id: option.value,
        text: option.text,
      };
      if (option.attributes.url) {
        newOption.url = option.attributes.url.value;
      }
      return newOption;
    }),
    allowClear: true,
  });
  $('#imageSelect').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#imageSelect').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#imageUpload').on('click', () => {
    $('#imageSelect').val('').trigger('change');
    $('#logoDiv').hide();
  });
  // OPTIONS POPUP
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get('tab');
  switch (tab) {
    case 'header':
      $('#tab-m1').prop('checked', true);
      $('#tab-t1').prop('checked', true);
      break;
    case 'meet':
      $('#tab-m1').prop('checked', true);
      $('#tab-t2').prop('checked', true);
      break;
    case 'device':
      $('#tab-m1').prop('checked', true);
      $('#tab-t3').prop('checked', true);
      break;
    case 'call':
      $('#tab-m1').prop('checked', true);
      $('#tab-t4').prop('checked', true);
      break;
    case 'message':
      $('#tab-m1').prop('checked', true);
      $('#tab-t5').prop('checked', true);
      break;
    case 'admin':
      $('#tab-m2').prop('checked', true);
      $('#tab-b1').prop('checked', true);
      break;
    case 'integrations':
      $('#tab-m2').prop('checked', true);
      $('#tab-b2').prop('checked', true);
      break;
    case 'cloud':
      $('#tab-m2').prop('checked', true);
      $('#tab-b3').prop('checked', true);
      break;
    case 'meetings':
      $('#tab-m2').prop('checked', true);
      $('#tab-b4').prop('checked', true);
      break;
    case 'calling':
      $('#tab-m2').prop('checked', true);
      $('#tab-b5').prop('checked', true);
      break;
    case 'messaging':
      $('#tab-m2').prop('checked', true);
      $('#tab-b6').prop('checked', true);
      break;
    case 'endpoints':
      $('#tab-m2').prop('checked', true);
      $('#tab-b7').prop('checked', true);
      break;
    case 'contact':
      $('#tab-m2').prop('checked', true);
      $('#tab-b8').prop('checked', true);
      break;
    default:
    // Default to New User Tab
  }
  // $('[id^=tab]').on('click', () => {
  //   $('[id="errorMessage"]').hide();
  //   $('[id="successMessage"]').hide();
  // });
  $('[id$=Priority]').select2({
    minimumResultsForSearch: -1,
    allowClear: true,
    placeholder: 'Select...',
  });
  $('[id$=Priority]').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('[id$=Priority]').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('[id^=opt]').select2({
    minimumResultsForSearch: -1,
    allowClear: true,
    placeholder: 'Select Option...',
  });
  $('[id^=opt]').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('[id^=opt]').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  const systemString = $('#systemExisting').val();
  const reasonString = $('#reasonExisting').val();
  const cacheString = $('#cacheExisting').val();
  if (systemString && systemString.match(/^{.*}$/)) {
    const systemJSON = JSON.parse(systemString);
    let reasonJSON;
    if (reasonString && reasonString.match(/^{.*}$/)) {
      reasonJSON = JSON.parse(reasonString);
    } else {
      reasonJSON = {};
    }
    let cacheJSON;
    if (cacheString && cacheString.match(/^{.*}$/)) {
      cacheJSON = JSON.parse(cacheString);
    } else {
      cacheJSON = {};
    }
    const systemArray = Object.keys(systemJSON).map(
      (k) => ({ key: k, value: systemJSON[k] }),
    );
    systemArray.forEach((item) => {
      const key = item.key.replace('opt', 'sys');
      if ($(`#${key}`).length > 0) {
        switch (item.value) {
          case 'default':
            $(`#${key}`).html('Not Deployed');
            break;
          case 'optimal':
          case 'deployed':
            $(`#${key}`).html('Optimal Experience');
            break;
          case 'focus':
          case 'challenge':
            $(`#${key}`).html('Focus Area');
            break;
          default:
            $(`#${key}`).html(item.value[0].toUpperCase() + item.value.substring(1));
        }
        if (reasonJSON[item.key]) {
          $(`#${key}Reason`).html(reasonJSON[item.key]);
          $(`#${key}Div`).css('display', 'inline-block');
        }
        if (cacheJSON[item.key]) {
          $(`#${key}`).css('color', 'blue');
          if (reasonJSON[item.key]) {
            $(`#${key}Reason`).html(`Cached Result: ${reasonJSON[item.key]}`);
          } else {
            $(`#${key}Reason`).html('Cached Result');
          }
          $(`#${key}Div`).css('display', 'inline-block');
        }
      }
    });
  }
  const overrideString = $('#overrideExisting').val();
  if (overrideString && overrideString.match(/^{.*}$/)) {
    const overrideJSON = JSON.parse(overrideString);
    const overrideArray = Object.keys(overrideJSON).map(
      (k) => ({ key: k, value: overrideJSON[k] }),
    );
    overrideArray.forEach((item) => {
      if ($(`#${item.key}`).length > 0) {
        // Cater for Legacy values
        let result = item.value;
        switch (result) {
          case 'deployed':
            result = 'optimal';
            break;
          case 'challenge':
            result = 'focus';
            break;
          default:
        }
        $(`#${item.key}`).val(result).trigger('change');
      }
    });
  }
  $('#collabMap').on('click', () => {
    loadWindow('/config/popup?type=map', 'Map_Window', 1291, 731);
    return false;
  });
  // STORY POPUP
  $('#storySelect').on('select2:clear', () => {
    // Clear All
    $('#storyTitle, #storyDescription').val(null).trigger('change');
    $('#storyComponents').html('').trigger('change');
  });
  $('#storySelect').on('select2:select', (e) => {
    // Clear Story and Delete
    $('#storyTitle').val(e.params.data.text);
    $('#storyDescription').val(e.params.data.description);
    $('#storyComponents').html('').trigger('change');
    // Populate Story Components
    if (e.params.data.components) {
      if (typeof e.params.data.components === 'string') {
        e.params.data.components = JSON.parse(e.params.data.components);
      }
      e.params.data.components.forEach((componentId) => {
        $.ajax({
          type: 'GET',
          url: `/config/ajax?search=${componentId}&type=componentId`,
        }).then((component) => {
          const option = new Option(component.text, component.id, true, true);
          $('#storyComponents').append(option).trigger('change');
        });
      });
    }
  });
  $('#storySelect').select2({
    ajax: {
      url: '/config/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'story',
        };
        return query;
      },
    },
    // minimumResultsForSearch: -1,
    placeholder: 'Select/Search or Create New below...',
    minimumInputLength: 2,
    // https://www.gyrocode.com/articles/predefined-options-for-select2-control-using-remote-data-source/
    dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    defaultResults: $.map($('#storySelect option'), (option) => {
      const newOption = {
        id: option.value,
        text: option.text,
      };
      if (option.attributes.components) {
        newOption.components = option.attributes.components.value;
      }
      if (option.attributes.subtasks) {
        newOption.subtasks = option.attributes.subtasks.value;
      }
      if (option.attributes.regions) {
        newOption.regions = option.attributes.regions.value;
      }
      if (option.attributes.description) {
        newOption.description = option.attributes.description.value;
      }
      if (option.attributes.active) {
        newOption.active = option.attributes.active.value;
      }
      if (option.attributes.initiative) {
        newOption.initiative = option.attributes.initiative.value;
      }
      return newOption;
    }),
    allowClear: true,
  });
  $('#storyComponents').select2({
    ajax: {
      url: '/config/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'components',
        };
        return query;
      },
    },
    // minimumResultsForSearch: -1,
    placeholder: '(Required) Story Components...',
    minimumInputLength: 2,
    // https://www.gyrocode.com/articles/predefined-options-for-select2-control-using-remote-data-source/
    // dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    // defaultResults: $.map($('#storyComponents option'), (option) => {
    //   const newOption = {
    //     id: option.value,
    //     text: option.text,
    //   };
    //   return newOption;
    // }),
    allowClear: true,
  });
  $('#storyTitle').on('input', () => {
    let val = $('#storyTitle').val();
    val = val.replace(/[^a-zA-Z0-9-_\s]/g, '');
    val = val.replace(/^(.*)\s\s(.*)$/g, '$1 $2');
    val = val.trimStart();
    $('#storyTitle').val(val);
  });
  $('#storyDescription').on('input', () => {
    let val = $('#storyDescription').val();
    val = val.replace(/[^a-zA-Z0-9-_\s\n.;:,?"'<>@/]/g, '');
    val = val.trimStart();
    $('#storyDescription').val(val);
  });
  $('#storySelect, #storyComponents').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#storySelect, #storyComponents').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#storyList').on('click', (e) => {
    const parentId = e.target.attributes.parent.value;
    loadWindow(`/config/redirect?type=storyList&parentId=${parentId}`, 'Story_Window', 1300, 500);
    return false;
  });
  $('[id="componentList"]').on('click', (e) => {
    const parentId = e.target.attributes.parent.value;
    loadWindow(`/config/redirect?type=components&parentId=${parentId}`, 'Pop_Window', 1300, 500);
    return false;
  });
  // INIT POPUP
  $('#exitingStories').on('select2:clear', () => {
    // Restore Fields
    $('#initTitle, #initDescription, #initComment, #initTime').prop('readonly', false);
    $('#initComponents').prop('disabled', false);
    $('#initSubmit, #componentList').removeAttr('disabled');
    $('#linkStory').attr('disabled', 'disabled');
  });
  $('#exitingStories').on('select2:select', () => {
    // Disable Fields
    $('#initTitle, #initDescription, #initComment, #initTime').prop('readonly', true);
    $('#initComponents, #initSubmit').prop('disabled', true);
    $('#initSubmit, #componentList').attr('disabled', 'disabled');
    $('#linkStory').removeAttr('disabled');
  });
  $('#exitingStories').select2({
    ajax: {
      url: '/config/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'epicStories',
        };
        return query;
      },
    },
    // minimumResultsForSearch: -1,
    placeholder: 'Link Initiative to an existing Jira Story...',
    templateResult: formatAccount,
    minimumInputLength: 2,
    allowClear: true,
  });
  $('#initComponents').select2({
    ajax: {
      url: '/config/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'components',
        };
        return query;
      },
    },
    placeholder: '(Required) Initiative Components...',
    minimumInputLength: 2,
    allowClear: true,
  });
  $('#initTitle').on('input', () => {
    let val = $('#initTitle').val();
    val = val.replace(/[^a-zA-Z0-9-_\s]/g, '');
    val = val.replace(/^(.*)\s\s(.*)$/g, '$1 $2');
    val = val.trimStart();
    $('#initTitle').val(val);
  });
  $('#initDescription').on('input', () => {
    let val = $('#initDescription').val();
    val = val.replace(/[^a-zA-Z0-9-_\s\n.;:,?"'<>@/]/g, '');
    val = val.trimStart();
    $('#initDescription').val(val);
  });
  $('#initComment').on('input', () => {
    let val = $('#initComment').val();
    val = val.replace(/[^a-zA-Z0-9-_\s\n.;:,?"'<>@/]/g, '');
    val = val.trimStart();
    $('#initComment').val(val);
    $('#initTime').removeAttr('required');
    if (val.length > 0) {
      $('#initTime').attr('required', '');
    }
  });
  $('#initTime').on('input', () => {
    let val = $('#initTime').val();
    val = val.replace(/[^0-9hm.\s]/g, '');
    val = val.replace(/^(.*)\s\s(.*)$/g, '$1 $2');
    val = val.trimStart();
    $('#initTime').val(val);
    $('#initComment').removeAttr('required');
    if (val.length > 0) {
      $('#initComment').attr('required', '');
    }
  });
  $('#exitingStories, #initComponents').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#exitingStories, #initComponents').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
});
function sendValue(value) {
  const urlParams = new URLSearchParams(window.location.search);
  const parentId = urlParams.get('parentId');
  window.opener.updateValue(parentId, value);
  window.close();
}
function updateValue(id, data) {
  switch (id) {
    case 'initComponents':
    case 'storyComponents':
    case 'subtaskComponents': {
      if ($(`#${id}`).find(`option[value=${data.id}]`).length) {
        // Find existing selections
        let options = $(`#${id}`).select2('data');
        options = options.map((item) => item.id);
        // Add new selection
        options.push(data.id);
        // Send final array set
        $(`#${id}`).val(options).trigger('change');
      } else {
        const option = new Option(data.text, data.id, true, true);
        $(`#${id}`).append(option).trigger('change');
      }
      break;
    }
    case 'storySelect':
    case 'subtaskSelect': {
      if (data.fullDescription) {
        // eslint-disable-next-line no-param-reassign
        data.description = data.fullDescription;
      }
      $(`#${id}`).val(null).trigger('select2:clear');
      const option = new Option(data.text, data.id, true, true);
      $(`#${id}`).append(option).trigger('change');
      $(`#${id}`).trigger({
        type: 'select2:select',
        params: {
          data,
        },
      });
      break;
    }
    default:
  }
}
