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
$(window).on('beforeunload', (e) => {
  if (e.target && e.target.activeElement.href) {
    const { href } = e.target.activeElement;
    if (href.match(/ciscospark/)) {
      return;
    }
  }
  showLoading();
});
$(() => {
  $('#dashboard').DataTable({
    dom: 'Blfrtip',
    pageLength: 100,
    order: [[4, 'desc']],
    columnDefs: [
      { orderable: false, targets: [0, 1] },
    ],
    buttons: [
      {
        extend: 'csv',
        text: 'Export CSV',
        className: 'InputButtonMargin',
      },
    ],
  });
  const images = ['mountain.png', 'office.png', 'office2.png', 'office3.png'];
  $('html').css({
    'background-image': `url('img/${
      images[Math.floor(Math.random() * images.length)]
    }')`,
    'background-size': 'cover',
  });
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  switch (type) {
    case 'customer':
      $('#tab-1').prop('checked', true);
      break;
    case 'org':
      $('#tab-2').prop('checked', true);
      break;
    case 'deploy':
      $('#tab-3').prop('checked', true);
      break;
    case 'init':
      $('#tab-4').prop('checked', true);
      break;
    case 'story':
      $('#tab-5').prop('checked', true);
      break;
    default:
    // Default to New User Tab
  }
  // $('#tab-1, #tab-2, #tab-3, #tab-4, #tab-5, #tab-6').on('click', () => {
  //   $('[id="errorMessage"]').hide();
  // });
  function formatCustomer(customer) {
    if (!customer.id) {
      return customer.text;
    }

    const $container = $(
      `<div class='select2-result-account clearfix'>
        <div class='select2-result-account__title'>${customer.text}</div>
        <div class='select2-result-account__id'>${customer.id}</div>
        <div class='select2-result-account__site'>${customer.site}</div>
      </div>`,
    );

    if (!customer.flag) {
      return $container;
    }

    const url = 'https://flagcdn.com/h20/';
    const $container2 = $(
      `<div class='select2-result-account clearfix'>
        <div class='select2-result-account__title'>${customer.text}</div>
        <div class='select2-result-account__id'>${customer.id} (${customer.arrBracket})</div>
        <div class='select2-result-account__id'><img src='${url}${customer.flag}.png' style='height: 10px' /> ${customer.location}</div>
        <div class='select2-result-account__site'>${customer.site}</div>
      </div>`,
    );

    return $container2;
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
  function setQueryParameter(param, value) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set(param, value);
    const newRelativePathQuery = `${window.location.pathname}?${searchParams.toString()}`;
    history.pushState(null, '', newRelativePathQuery);
  }
  // Remove Refresh Query Param
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.delete('refresh');
  const newRelativePathQuery = `${window.location.pathname}?${searchParams.toString()}`;
  history.replaceState(null, '', newRelativePathQuery);
  ///
  function copyToClipboard(text) {
    const sampleText = document.createElement('textarea');
    document.body.appendChild(sampleText);
    sampleText.value = text;
    sampleText.select();
    document.execCommand('copy');
    document.body.removeChild(sampleText);
  }
  $('#helpLink').on('click', () => {
    loadWindow('/config/help', 'Pop_Window', 700, 500);
    return false;
  });
  $('#refreshAccount').on('click', () => {
    setQueryParameter('refresh', 'true');
    showLoading();
    location.reload();
  });
  $('#refreshDashboard').on('click', () => {
    setQueryParameter('refresh', 'true');
    setQueryParameter('dashboard', 'true');
    showLoading();
    location.reload();
  });
  // CUSTOMER TAB
  $('#customerSelect').select2({
    ajax: {
      url: '/config/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'customer',
        };
        return query;
      },
    },
    placeholder: 'Select/Search for Customer...',
    minimumInputLength: 2,
    templateResult: formatCustomer,
    // https://www.gyrocode.com/articles/predefined-options-for-select2-control-using-remote-data-source/
    dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    defaultResults: $.map($('#customerSelect option'), (option) => {
      const newOption = {
        id: option.value,
        text: option.text,
      };
      if (option.attributes.site) {
        newOption.site = option.attributes.site.value;
      }
      if (option.attributes.flag) {
        newOption.flag = option.attributes.flag.value;
      }
      if (option.attributes.arrBracket) {
        newOption.arrBracket = option.attributes.arrBracket.value;
      }
      if (option.attributes.location) {
        newOption.location = option.attributes.location.value;
      }
      return newOption;
    }),
    allowClear: true,
  });
  $('#customerSelect').on('select2:select', (e) => {
    showLoading();
    location.replace(`/config?accountId=${e.params.data.id}`);
  });
  $('#customerSelect').on('select2:clear', () => {
    // Clear All
    $('#accountId, #accountName, #healthScore, #siteNames, #ccseName, #csmName, #orgId').val(null).trigger('change');
  });
  $('#customerSelect').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#customerSelect').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#linkEpic').on('click', () => {
    const accountId = $('#accountId').val();
    loadWindow(`/config/redirect?type=epic&accountId=${accountId}`, 'Epic', 500, 250);
    return false;
  });
  $('#linkAccounts').on('click', (e) => {
    const epicId = e.target.attributes.epic.value;
    loadWindow(`/config/redirect?type=linkAccounts&epicId=${epicId}`, 'Link', 1200, 500);
    return false;
  });
  $('#assigneeChanges').on('click', (e) => {
    const epicId = e.target.attributes.epic.value;
    loadWindow(`/config/redirect?type=assigneeChanges&epicId=${epicId}`, 'Assignee', 1200, 500);
    return false;
  });
  $('#collabMap').on('click', () => {
    loadWindow('/config/redirect?type=map', 'Map_Window', 1291, 731);
    return false;
  });
  $('#publishMap').on('click', () => {
    loadWindow('/config/redirect?type=publish', 'Publish_Window', 200, 200);
    return false;
  });
  $('#collabOptions').on('click', () => {
    loadWindow('/config/redirect?type=options', 'Options_Window', 1050, 680);
    return false;
  });
  $('#collabLogo').on('click', () => {
    loadWindow('/config/redirect?type=logo', 'Logo_Window', 600, 430);
    return false;
  });
  // ORG TAB
  $('[id="copyOrgId"]').on('click', () => {
    const orgId = $('#orgId').val();
    copyToClipboard(orgId);
  });
  $('[id="siteOptions"]').on('click', (e) => {
    const site = e.target.name;
    loadWindow(`/config/redirect?type=siteOptions&site=${site}`, 'Map_Window', 1200, 600);
    return false;
  });
  // INIT TAB
  $('[id="newInit"]').on('click', (e) => {
    const storyId = e.target.attributes.story.value;
    const tab = e.target.attributes.tab.value;
    const epicId = e.target.attributes.epic.value;
    setQueryParameter('type', tab);
    loadWindow(`/config/redirect?type=init&epicId=${epicId}&storyId=${storyId}`, 'Comments', 500, 650);
    return false;
  });
  $('[id="jiraComment"]').on('click', (e) => {
    const issueId = e.target.attributes.issue.value;
    const tab = e.target.attributes.tab.value;
    setQueryParameter('type', tab);
    loadWindow(`/config/redirect?type=comments&issueId=${issueId}`, 'Comments', 700, 500);
    return false;
  });
  $('[id="jiraWorklog"]').on('click', (e) => {
    const issueId = e.target.attributes.issue.value;
    const tab = e.target.attributes.tab.value;
    const epicId = e.target.attributes.epic.value;
    setQueryParameter('type', tab);
    loadWindow(`/config/redirect?type=worklogs&epicId=${epicId}&issueId=${issueId}`, 'Comments', 700, 500);
    return false;
  });
  $('[id="jiraTransition"]').on('click', (e) => {
    const issueId = e.target.attributes.issue.value;
    const tab = e.target.attributes.tab.value;
    const epicId = e.target.attributes.epic.value;
    setQueryParameter('type', tab);
    loadWindow(`/config/redirect?type=transitions&epicId=${epicId}&issueId=${issueId}`, 'Transition', 700, 500);
    return false;
  });
  $('[id="createSubtask"]').on('click', (e) => {
    const issueId = e.target.attributes.issue.value;
    const tab = e.target.attributes.tab.value;
    let templateId = false;
    if (e.target.attributes.template) {
      templateId = e.target.attributes.template.value;
    }
    const epicId = e.target.attributes.epic.value;
    setQueryParameter('type', tab);
    loadWindow(`/config/redirect?type=subtasks&epicId=${epicId}&issueId=${issueId}&templateId=${templateId}`, 'Subtask', 500, 590);
    return false;
  });
  $('[id="editStory"]').on('click', (e) => {
    const issueId = e.target.attributes.issue.value;
    const tab = e.target.attributes.tab.value;
    const epicId = e.target.attributes.epic.value;
    setQueryParameter('type', tab);
    loadWindow(`/config/redirect?type=editStory&epicId=${epicId}&issueId=${issueId}`, 'Edit', 500, 420);
    return false;
  });
  $('[id="editSubtask"]').on('click', (e) => {
    const issueId = e.target.attributes.issue.value;
    const tab = e.target.attributes.tab.value;
    const epicId = e.target.attributes.epic.value;
    setQueryParameter('type', tab);
    loadWindow(`/config/redirect?type=editSubtask&epicId=${epicId}&issueId=${issueId}`, 'Edit', 500, 420);
    return false;
  });
  // STORY TAB
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
    placeholder: 'Raise a new Account Story...',
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
      if (option.attributes.description) {
        newOption.description = option.attributes.description.value;
      }
      if (option.attributes.active) {
        newOption.active = option.attributes.active.value;
      }
      return newOption;
    }),
    allowClear: true,
  });
  $('#storySelect').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#storySelect').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#storyList').on('click', () => {
    loadWindow('/config/redirect?type=storyList', 'Story_Window', 1200, 500);
    return false;
  });
  $('[id="storyNew"]').on('click', (e) => {
    const tab = e.target.attributes.tab.value;
    const epicId = e.target.attributes.epic.value;
    setQueryParameter('type', tab);
    loadWindow(`/config/redirect?type=stories&epicId=${epicId}`, 'New_Story', 500, 590);
    return false;
  });
  // DEPLOYMENT TAB
  $('[id$=Platform]').select2({
    minimumResultsForSearch: -1,
    allowClear: true,
    placeholder: 'Select Option...',
  });
  $('[id$=Platform]').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('[id$=Platform]').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });

  const deployString = $('#deployExisting').val();
  if (deployString && deployString.match(/^{.*}$/)) {
    const deployJSON = JSON.parse(deployString);
    if (deployJSON.messagingPlatform) {
      $('#messagingPlatform').val(deployJSON.messagingPlatform).trigger('change');
    }
    if (deployJSON.meetingPlatform) {
      $('#meetingPlatform').val(deployJSON.meetingPlatform).trigger('change');
    }
    if (deployJSON.callingPlatform) {
      $('#callingPlatform').val(deployJSON.callingPlatform).trigger('change');
    }
    if (deployJSON.contactPlatform) {
      $('#contactPlatform').val(deployJSON.contactPlatform).trigger('change');
    }
  }
  const systemString = $('#systemExisting').val();
  const reasonString = $('#reasonExisting').val();
  if (systemString && systemString.match(/^{.*}$/)) {
    const systemJSON = JSON.parse(systemString);
    let reasonJSON;
    if (reasonString && reasonString.match(/^{.*}$/)) {
      reasonJSON = JSON.parse(reasonString);
    } else {
      reasonJSON = {};
    }
    const systemArray = Object.keys(systemJSON).map(
      (k) => ({ key: k, value: systemJSON[k] }),
    );
    systemArray.forEach((item) => {
      const key = item.key.replace('opt', 'sys');
      if ($(`#${key}`).length > 0) {
        $(`#${key}`).html(item.value);
        if (reasonJSON[item.key]) {
          $(`#${key}Reason`).html(reasonJSON[item.key]);
          $(`#${key}Div`).css('display', 'inline-block');
        }
      }
    });
  }
});
