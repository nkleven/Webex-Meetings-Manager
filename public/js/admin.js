/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
$(() => {
  const images = ['mountain.png', 'office.png', 'office2.png', 'office3.png'];
  $('html').css({
    'background-image': `url('img/${
      images[Math.floor(Math.random() * images.length)]
    }')`,
    'background-size': 'cover',
  });
  $('#roomSave, #userSave, #botSave, #storySave').hide();
  $('#roomDelete, #userDelete, #botDelete, #storyDelete').hide();
  const admin = {};
  admin.storyCreatorDisabled = 'readonly';
  admin.storyManagerDisabled = 'readonly';
  admin.storyCreatorClear = false;
  admin.storyManagerClear = false;
  admin.roomDisabled = 'readonly';
  admin.roomClear = false;
  admin.botDisabled = 'readonly';
  admin.botClear = false;
  if ($('#storyDelete').length) {
    admin.storyCreatorDisabled = null;
    admin.storyCreatorClear = true;
  }
  if ($('#storySave').length) {
    admin.storyManagerDisabled = null;
    admin.storyManagerClear = true;
  }
  if ($('#roomSave').length) {
    admin.roomDisabled = null;
    admin.roomClear = true;
  }
  if ($('#botDelete').length) {
    admin.botDisabled = null;
    admin.botClear = true;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  switch (type) {
    case 'story':
      $('#tab-1').prop('checked', true);
      break;
    case 'subtask':
      $('#tab-2').prop('checked', true);
      break;
    case 'issue':
      $('#tab-3').prop('checked', true);
      break;
    case 'epic':
      $('#tab-4').prop('checked', true);
      break;
    case 'user':
      $('#tab-5').prop('checked', true);
      break;
    default:
    // Default to Role Tab
  }
  // $('#tab-1, #tab-2, #tab-3').on('click', () => {
  //   $('[id="successMessage"]').hide();
  //   $('[id="errorMessage"]').hide();
  // });
  function formatUser(user) {
    if (!user.avatar) {
      return user.text;
    }

    const $container = $(
      `<div class='select2-result-user clearfix'>
        <div class='select2-result-user__avatar'><img src='${user.avatar}' /></div>
        <div class='select2-result-user__meta'>
          <div class='select2-result-user__title'>${user.text}</div>
          <div class='select2-result-user__email'>${user.email}</div>
        </div>
      </div>`,
    );

    return $container;
  }
  function formatItemSelection(item) {
    return item.key || item.text;
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
  $('#helpLink').on('click', () => {
    loadWindow('/admin/help', 'Pop_Window', 700, 500);
    return false;
  });
  // USER TAB
  $('#userSelect').select2({
    ajax: {
      url: '/admin/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'user',
        };
        return query;
      },
    },
    placeholder: 'Select or Search for User...',
    minimumInputLength: 2,
    templateResult: formatUser,
    // https://www.gyrocode.com/articles/predefined-options-for-select2-control-using-remote-data-source/
    dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    defaultResults: $.map($('#userSelect option'), (option) => {
      const newOption = {
        id: option.value,
        text: option.text,
      };
      if (option.attributes.uid) {
        newOption.uid = option.attributes.uid.value;
      }
      return newOption;
    }),
    allowClear: true,
  });
  $('#userConfig').select2({
    ajax: {
      url: '/admin/ajax',
      dataType: 'json',
      // delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'config',
        };
        return query;
      },
    },
    minimumResultsForSearch: -1,
    placeholder: '(Optional) Select Config Roles...',
    allowClear: true,
  });
  $('#userAdmin').select2({
    ajax: {
      url: '/admin/ajax',
      dataType: 'json',
      // delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'admin',
        };
        return query;
      },
    },
    minimumResultsForSearch: -1,
    placeholder: '(Optional) Select Admin Roles...',
    allowClear: true,
  });
  $('#userSelect').on('select2:clear', () => {
    // Clear All
    $('#userConfig, #userAdmin').html('').trigger('change');
    $('#userSave').hide();
    if ($('#userDelete').length) {
      $('#userDelete').hide();
    }
  });
  $('#userSelect').on('select2:select', (e) => {
    // Clear Roles and Delete
    $('#userConfig, #userAdmin').html('').trigger('change');
    $('#userDelete').hide();
    $('#userSave').show();
    // If Existing User, show Delete
    if (e.params.data.uid) {
      $('#userDelete').show();
    }
    $.ajax({
      type: 'GET',
      url: `/admin/ajax?search=${e.params.data.id}&type=userId`,
    }).then((user) => {
      // If User has Config roles, populate
      if (user.config) {
        user.config.forEach((configId) => {
          $.ajax({
            type: 'GET',
            url: `/admin/ajax?search=${configId}&type=configId`,
          }).then((role) => {
            const option = new Option(role.text, role.id, true, true);
            $('#userConfig').append(option).trigger('change');
          });
        });
      }
      // If User has Admin roles, populate
      if (user.admin) {
        user.admin.forEach((adminId) => {
          $.ajax({
            type: 'GET',
            url: `/admin/ajax?search=${adminId}&type=adminId`,
          }).then((role) => {
            const option = new Option(role.text, role.id, true, true);
            $('#userAdmin').append(option).trigger('change');
          });
        });
      }
    });
  });
  $('#userSelect, #userConfig, #userAdmin').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#userSelect, #userConfig, #userAdmin').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#userList').on('click', () => {
    loadWindow('/admin/list?type=user', 'Pop_Window', 1200, 500);
    return false;
  });
  // STORIES TAB
  $('#storySelect').on('select2:clear', () => {
    // Clear All
    $('#storyId, #storyTitle, #storyDescription, #storyExisting').val(null).trigger('change');
    $('#storyComponents, #storySubtasks').html('').trigger('change');
    $('#storyRegions').val('').trigger('change');
    $('#storyInitiative, #storyActive').prop('checked', false);
    // $('#storyActive').prop('checked', false).trigger('change');
    $('#storyId').removeClass('input-invalid');
    $('#storyId').removeClass('input-valid');
    $('#storySave').hide();
    if ($('#storyDelete').length) {
      $('#storyDelete').hide();
      $('#storyId').prop('readonly', false);
    }
  });
  $('#storySelect').on('select2:select', (e) => {
    // Clear Story and Delete
    $('#storyId').val(e.params.data.id);
    $('#storyId').prop('readonly', true);
    $('#storyInitiative, #storyActive').prop('checked', false);
    $('#storyId').removeClass('input-invalid');
    $('#storyId').removeClass('input-valid');
    $('#storyExisting').val(e.params.data.id);
    $('#storyTitle').val(e.params.data.text);
    $('#storyDescription').val(e.params.data.description);
    $('#storyComponents, #storySubtasks').html('').trigger('change');
    $('#storyRegions').val('').trigger('change');
    // $('#storyActive').removeAttr('checked').trigger('change');
    $('#storyDelete').hide();
    $('#storySave').show();
    // If Existing Story, show Delete
    if (e.params.data.id) {
      $('#storyDelete').show();
    }

    // Populate Story Components
    if (e.params.data.components) {
      if (typeof e.params.data.components === 'string') {
        e.params.data.components = JSON.parse(e.params.data.components);
      }
      e.params.data.components.forEach((componentId) => {
        $.ajax({
          type: 'GET',
          url: `/admin/ajax?search=${componentId}&type=componentId`,
        }).then((component) => {
          const option = new Option(component.text, component.id, true, true);
          $('#storyComponents').append(option).trigger('change');
        });
      });
    }
    // Populate Story Subtasks
    if (e.params.data.subtasks) {
      if (typeof e.params.data.subtasks === 'string') {
        e.params.data.subtasks = JSON.parse(e.params.data.subtasks);
      }
      e.params.data.subtasks.forEach((subtaskId) => {
        $.ajax({
          type: 'GET',
          url: `/admin/ajax?search=${subtaskId}&type=subtaskId`,
        }).then((subtask) => {
          const option = new Option(subtask.text, subtask.id, true, true);
          $('#storySubtasks').append(option).trigger('change');
        });
      });
    }
    // Populate Story Regions
    if (e.params.data.regions) {
      if (typeof e.params.data.regions === 'string') {
        e.params.data.regions = JSON.parse(e.params.data.regions);
      }
      $('#storyRegions').val(e.params.data.regions).trigger('change');
    }
    // Populate Story Active Status
    if (e.params.data.active) {
      $('#storyActive').prop('checked', 'checked');
    }
    // Populate Story Initiative Status
    if (e.params.data.initiative) {
      $('#storyInitiative').prop('checked', 'checked');
    }
  });
  $('#storySelect').select2({
    ajax: {
      url: '/admin/ajax',
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
      url: '/admin/ajax',
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
    dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    defaultResults: $.map($('#storyComponents option'), (option) => {
      const newOption = {
        id: option.value,
        text: option.text,
      };
      return newOption;
    }),
    allowClear: admin.storyManagerClear,
    disabled: admin.storyManagerDisabled,
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
  $('#storySubtasks').select2({
    ajax: {
      url: '/admin/ajax',
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
    placeholder: '(Optional) Populated Subtasks for Story...',
    minimumInputLength: 2,
    templateSelection: formatItemSelection,
    allowClear: admin.storyManagerClear,
    disabled: admin.storyManagerDisabled,
  });
  let storyIdTimeout = null;
  $('#storyId').on('input', () => {
    let val = $('#storyId').val();
    const existing = $('#storyExisting').val();
    val = val.toLowerCase();
    val = val.replace(/[^a-zA-Z0-9-_]/g, '');
    $('#storyId').val(val);
    $('#storySave').hide();
    if (val.length > 0) {
      $('#storySave').show();
    }
    if (storyIdTimeout) {
      clearTimeout(storyIdTimeout);
    }
    $('#storyId').removeClass('input-valid');
    $('#storyId').removeClass('input-invalid');
    if (val !== existing) {
      storyIdTimeout = setTimeout(() => {
        $.ajax({
          type: 'GET',
          dataType: 'json',
          url: `/admin/ajax?search=${val}&type=storyIdExist`,
        }).then((response) => {
          if (response.result) {
            $('#storyId').addClass('input-invalid');
          } else {
            $('#storyId').addClass('input-valid');
          }
        });
      }, 750);
    }
  });
  $('#storySelect, #storyComponents, #storySubtasks, #storyRegions').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#storySelect, #storyComponents, #storySubtasks, #storyRegions').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#storyList').on('click', () => {
    loadWindow('/admin/list?type=stories', 'Pop_Window', 1200, 500);
    return false;
  });
  $('#storyRegions').select2({
    minimumResultsForSearch: -1,
    allowClear: true,
    placeholder: '(Optional) Story Regions...',
  });
  $('#storyRegionsAll').on('click', () => {
    const storyId = $('#storyId').val();
    if (storyId.length > 0) {
      $('#storyRegions').val(['americas', 'emear', 'apjc']).trigger('change');
    }
  });
  $('[id="componentList"]').on('click', () => {
    loadWindow('/admin/list?type=components', 'Pop_Window', 1200, 500);
    return false;
  });
  // SUBTASK TAB
  $('#subtaskSelect').on('select2:clear', () => {
    // Clear All
    $('#subtaskId, #subtaskTitle, #subtaskDescription, #subtaskExisting').val(null).trigger('change');
    $('#subtaskComponents').html('').trigger('change');
    // $('#subtaskActive').prop('checked', false).trigger('change');
    $('#subtaskId').removeClass('input-invalid');
    $('#subtaskId').removeClass('input-valid');
    $('#subtaskSave').hide();
    if ($('#subtaskDelete').length) {
      $('#subtaskDelete').hide();
      $('#subtaskId').prop('readonly', false);
    }
  });
  $('#subtaskSelect').on('select2:select', (e) => {
    // Clear Subtask and Delete
    $('#subtaskId').val(e.params.data.id);
    $('#subtaskId').prop('readonly', true);
    $('#subtaskId').removeClass('input-invalid');
    $('#subtaskId').removeClass('input-valid');
    $('#subtaskExisting').val(e.params.data.id);
    $('#subtaskTitle').val(e.params.data.text);
    $('#subtaskDescription').val(e.params.data.description);
    $('#subtaskComponents').html('').trigger('change');
    // $('#subtaskActive').removeAttr('checked').trigger('change');
    $('#subtaskDelete').hide();
    $('#subtaskSave').show();
    // If Existing Subtask, show Delete
    if (e.params.data.id) {
      $('#subtaskDelete').show();
    }

    // Populate Subtask Components
    if (e.params.data.components) {
      if (typeof e.params.data.components === 'string') {
        e.params.data.components = JSON.parse(e.params.data.components);
      }
      e.params.data.components.forEach((componentId) => {
        $.ajax({
          type: 'GET',
          url: `/admin/ajax?search=${componentId}&type=componentId`,
        }).then((component) => {
          const option = new Option(component.text, component.id, true, true);
          $('#subtaskComponents').append(option).trigger('change');
        });
      });
    }
  });
  $('#subtaskSelect').select2({
    ajax: {
      url: '/admin/ajax',
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
      if (option.attributes.active) {
        newOption.active = option.attributes.active.value;
      }
      return newOption;
    }),
    allowClear: true,
  });
  $('#subtaskComponents').select2({
    ajax: {
      url: '/admin/ajax',
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
    dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
    defaultResults: $.map($('#subtaskComponents option'), (option) => {
      const newOption = {
        id: option.value,
        text: option.text,
      };
      return newOption;
    }),
    allowClear: admin.storyManagerClear,
    disabled: admin.storyManagerDisabled,
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
  let subtaskIdTimeout = null;
  $('#subtaskId').on('input', () => {
    let val = $('#subtaskId').val();
    const existing = $('#subtaskExisting').val();
    val = val.toLowerCase();
    val = val.replace(/[^a-zA-Z0-9-_]/g, '');
    $('#subtaskId').val(val);
    $('#subtaskSave').hide();
    if (val.length > 0) {
      $('#subtaskSave').show();
    }
    if (subtaskIdTimeout) {
      clearTimeout(subtaskIdTimeout);
    }
    $('#subtaskId').removeClass('input-valid');
    $('#subtaskId').removeClass('input-invalid');
    if (val !== existing) {
      subtaskIdTimeout = setTimeout(() => {
        $.ajax({
          type: 'GET',
          dataType: 'json',
          url: `/admin/ajax?search=${val}&type=subtaskIdExist`,
        }).then((response) => {
          if (response.result) {
            $('#subtaskId').addClass('input-invalid');
          } else {
            $('#subtaskId').addClass('input-valid');
          }
        });
      }, 750);
    }
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
  $('#subtaskList').on('click', () => {
    loadWindow('/admin/list?type=subtask', 'Pop_Window', 1200, 500);
    return false;
  });
  // EPIC TAB
  $('#epicUser').select2({
    ajax: {
      url: '/admin/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'epicUser',
        };
        return query;
      },
    },
    placeholder: 'Search Success Portal User...',
    minimumInputLength: 2,
    templateResult: formatUser,
    allowClear: true,
  });
  $('#epicLeader').select2({
    ajax: {
      url: '/admin/ajax',
      dataType: 'json',
      delay: 750,
      data: (params) => {
        const query = {
          search: params.term,
          type: 'epicLeader',
        };
        return query;
      },
    },
    placeholder: 'Search Success Portal Leader...',
    minimumInputLength: 2,
    templateResult: formatUser,
    allowClear: true,
  });
  $('#epicUser, #epicLeader, #theatre, #arrValue').on('select2:unselecting', () => {
    $(this).data('unselecting', true);
  });
  $('#epicUser, #epicLeader, #theatre, #arrValue').on('select2:opening', (e) => {
    if ($(this).data('unselecting')) {
      $(this).removeData('unselecting');
      e.preventDefault();
    }
  });
  $('#arrValue').select2({
    minimumResultsForSearch: -1,
    placeholder: '(Required) Select ARR Bracket...',
    allowClear: true,
  });
  $('#theatre').select2({
    minimumResultsForSearch: -1,
    placeholder: '(Required) Select Theatre...',
    allowClear: true,
  });
});
