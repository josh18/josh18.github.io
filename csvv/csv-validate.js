
// CSV Validate (CSVV)
// Created by Josh Hunt
// Add link to Github repo

/*

~~ To do ~~
- Add date picker (maybe not neccessary)
- Add date range support
- Language options
- Add range/decimal number support


~~ Structure ~~
- Default options
- Variables
- Utility functions
    - Notify : notify(message, type, callback, uniqueId)
    - Confirm : confirm(message, confirmText, callback)
- Step 1 : Upload CSV : uploadCSV()
- Step 2 : Match up headers : matchHeaders()
- Step 3 : Validate rows : validateRows(data)
- Step 4 : Output result

*/

var csvValidation = function(target, options, callback, debug) {

    // ~~ Default options
    
    // Class names
    var classes = [
        'btn',
        'btnDanger',
        'btnSecondary',
        'notify',
        'confirm',
        'select',
        'checkbox',
        'input',
        'inputSuccess',
        'inputFail',
        'title'
    ];
    
    // Check if classes exists
    for (var i = 0; i < classes.length; i++) {
        if (typeof options.classes[classes[i]] === 'undefined') {
            options.classes[classes[i]] = '';
        }
    }

    // Possible column types
    var validColumnTypes = [
        'text',
        'email',
        'number',
        'date'
    ];

    // Possible date formats
    var validDateFormats = [
        'dd/mm/yyyy',
        'dd-mm-yyyy',
        'mm/dd/yyyy',
        'mm-dd-yyyy',
        'yyyy/mm/dd',
        'yyyy-mm-dd'
    ];

    // Add defaults to columns
    for (i = 0; i < options.columns.length; i++) {

        // Required
        if (options.columns[i].required === 'true' || options.columns[i].required === true) {
            options.columns[i].required = true;
        } else {
            options.columns[i].required = false;
        }

        // Column type
        if (validColumnTypes.indexOf(options.columns[i].type) < 0) {
            if (debug && options.columns[i].type) {
                console.log('The cell type "' + options.columns[i].type + '" is not usable. Defaulting to "text".');
            }
            options.columns[i].type = 'text';
        }

        // Min Length
        options.columns[i].minLength = parseInt(options.columns[i].minLength, 10);
        if (options.columns[i].minLength < 0 || isNaN(options.columns[i].minLength)) {
            options.columns[i].minLength = 0;
        }
    }

    // Check if viable date format exists
    if (validDateFormats.indexOf(options.dateFormat) < 0) {
        if (debug) {
            console.log('The date format "' + options.dateFormat + '" is not usable. Defaulting to "dd/mm/yyyy".');
        }
        options.dateFormat =  'dd/mm/yyyy';
    }

    // Default messages
    if (typeof options.messages !== 'object') {
        options.messages = {};
    }

    if (!options.messages.required) {
        options.messages.required = 'This field is required.';
    }

    if (!options.messages.email) {
        options.messages.email = 'This field needs to be an email address.';
    }

    if (!options.messages.number) {
        options.messages.number = 'This field needs to be a number.';
    }

    if (!options.messages.date) {
        options.messages.date = 'This field needs to be a date in the format [dateFormat].';
    }

    if (!options.messages.minLength) {
        options.messages.minLength = 'This field needs to be longer than [minLength] characters.';
    }
    
    // ~~ Target variable
    
    var $target = $(target);

    $target.addClass('csvv-validation');

    // ~~ Transition browser support

    function transitionEndTest() {
        var el = document.createElement('div');

        var transEndEventNames = {
            transition       : 'transitionend',
            WebkitTransition : 'webkitTransitionEnd',
            MozTransition    : 'transitionend',
            OTransition      : 'oTransitionEnd otransitionend'
        };

        for (var name in transEndEventNames) {
            if (el.style[name] !== undefined) {
                return transEndEventNames[name];
            }
        }

        return false;
    }

    var browserSupportTransitionEnd = transitionEndTest();

    function transition($object, callbackStart, callback, callbackEnd) {
        if (browserSupportTransitionEnd && $object.length > 0) {
            // Remove any animations and redraw (animations can stop transitions from being completed)
            $object.css('animation', 'none').css('animation');

            // Before transition
            if (callbackStart) {
                callbackStart();
            }

            // Check if a transition exists
            if ($object.css('transition-duration') !== '0s') {
                // After transition
                $object.on(browserSupportTransitionEnd, function(e) {
                    // Check to make sure it isn't a child transition
                    if ($(e.target).is($object)) {
                        callback();
                        if (callbackEnd) {
                            callbackEnd();
                        }
                        $object.off(browserSupportTransitionEnd);
                    }
                });
            } else {
                callback();
                if (callbackEnd) {
                    callbackEnd();
                }
            }
        } else {
            callback();
        }
    }
    
    // ~~ Utility functions
    
    // Notify
    function notify(msg, type, uniqueId, location, callback) {
        
        function hideNotify() {
            transition($target.find('#csvvNotify-' + uniqueId), function() {
                $target.find('#csvvNotify-' + uniqueId).addClass('csvv-transition-out');
            }, function() {
                $target.find('#csvvNotify-' + uniqueId).remove();
            });
        }
        
        function changeMessage(html) {
            $target.find('#csvvNotify-' + uniqueId + ' #csvvNotifyMessage').html(html);
        }

        function showNotify() {

            var html = '';
            
            html += '<div class="csvv-notify csvv-notify-' + type + ' ' + options.classes.notify + '" id="csvvNotify-' + uniqueId + '">';
                html += '<div id="csvvNotifyMessage">' + msg + '</div>';
            html += '</div>';
            
            $(location).after(html);
            
            // Callback to edit notify
            if (callback) {
                callback(hideNotify, changeMessage);
            }
        }

        // Remove previous notify and then show current notify
        transition($target.find('#csvvNotify-' + uniqueId), function() {
            $target.find('#csvvNotify-' + uniqueId).addClass('csvv-transition-out');
        }, function() {
            $target.find('#csvvNotify-' + uniqueId).remove();
            showNotify();
        });
    }
    
    // Confirm
    function confirm(msg, confirmText, callback) {

        // Remove confirm
        function removeConfirm() {
            $confirm = $target.find('#csvvConfirm');
            transition($confirm, function() {
                $confirm.addClass('csvv-transition-out');
            }, function() {
                $confirm.remove();
            });
        }
        
        // Remove existing confirm
        removeConfirm();
        $target.off('click.confirm');
        
        var html = '';
        
        html += '<div class="csvv-confirm ' + options.classes.confirm + '" id="csvvConfirm">';
            html += '<div class="csvv-confirm-background" id="csvvConfirmBackground"></div>';
            html += '<div class="csvv-confirm-content">';
                html += '<div class="csvv-confirm-message">';
                    html += msg;
                html += '</div>';
                html += '<div class="csvv-confirm-controls">';
                    html += '<button class="csvv-btn csvv-btn-secondary ' + options.classes.btn + ' ' + options.classes.btnSecondary + '" id="csvvConfirmNo" type="button">Cancel</button>';
                    html += '<button class="csvv-btn ' + options.classes.btn + '" id="csvvConfirmYes" type="button">' + confirmText +'</button>';
                html += '</div>';
            html += '</div>';
        html += '</div>';
        
        $target.append(html);

        $target.on('click.confirm', '#csvvConfirmNo, #csvvConfirmBackground', function() {
           removeConfirm();
        });
        
        $target.on('click.confirm', '#csvvConfirmYes', function() {
            removeConfirm();
            callback();
        });
    }
    
    // Validate
    var validate = function() {
        
        // Number
        this.number = function(number, range, allowDecimals) {
            if (
                // number
                (number - parseFloat(number) + 1) >= 0 &&
                // min range
                (typeof(range) === 'undefined' || !('min' in range) || !parseFloat(range.min) || parseFloat(number) >= parseFloat(range.min)) &&
                // max range
                (typeof(range) === 'undefined' || !('max' in range) || !parseFloat(range.min) || parseFloat(number) >= parseFloat(range.max)) &&
                // decimals
                (typeof(allowDecimals) === 'undefined' || allowDecimals === true || parseFloat(number) % 1 === 0)
                ) {
                
                return true;
            } else {
                return false;
            }
        };
        
        // Email
        this.email = function(email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        };
        
        // Date
        this.date = function(date) {

            // Check if date uses / or - then convert the string to an array
            var dateArray;
            if ((date.match(/\//g)||[]).length === 2 && (options.dateFormat.match(/\//g)||[]).length === 2) {
                dateArray = date.split('/');
            } else if ((date.match(/-/g)||[]).length === 2 && (options.dateFormat.match(/-/g)||[]).length === 2) {
                dateArray = date.split('-');
            } else {
                return false;
            }

            // Check what date type is being used then convert the array to a date object
            var dateObject;
            if (options.dateFormat === 'dd/mm/yyyy' || options.dateFormat === 'dd-mm-yyyy') {
                dateObject = {
                    day: Number(dateArray[0]),
                    month: Number(dateArray[1]) - 1,
                    year: Number(dateArray[2])
                };
            } else if (options.dateFormat === 'mm/dd/yyyy' || options.dateFormat === 'mm-dd-yyyy') {
                dateObject = {
                    day: Number(dateArray[1]),
                    month: Number(dateArray[0]) - 1,
                    year: Number(dateArray[2])
                };
            } else if (options.dateFormat === 'yyyy/mm/dd' || options.dateFormat === 'yyyy-mm-dd') {
                dateObject = {
                    day: Number(dateArray[2]),
                    month: Number(dateArray[1]) - 1,
                    year: Number(dateArray[1])
                };
            }

            var dateInstance = new Date(dateObject.year, dateObject.month, dateObject.day);

            // Check if the date object is a valid date
            if (dateInstance && dateInstance.getFullYear() === dateObject.year && dateInstance.getMonth() === dateObject.month && dateInstance.getDate() === dateObject.day) {
                return true;
            } else {
                return false;
            }
        };
    };

    // Validate input
    function validateInput(value, required, type, minLength) {

        var result = {},
            check = new validate();

        result.valid = true;
        result.failed = [];

        // Check if required
        if (required === true && value === '') {
            result.valid = false;
            result.failed.push('required');
        }
        
        // Check value type
        if (type !== 'text') {
            if (!check[type](value) && value !== '') {
                result.valid = false;
                result.failed.push('type');
            }
        }
        
        // Check value length
        if (value.length < minLength && (required === true || value !== '')) {
            result.valid = false;
            result.failed.push('minLength');
        }

        return result;
    }

    // Step indicator
    function stepIndicator(step) {
        var html = '',
            stepString = '';

        if (step === 1) {
            stepString = 'one';
        } else if (step === 2) {
            stepString = 'two';
        } else if (step === 3) {
            stepString = 'three';
        } else if (step === 4) {
            stepString = 'four';
        }

        $target.removeClass('csvv-step-one csvv-step-two csvv-step-three csvv-step-four').addClass('csvv-step-' + stepString);

        html += '<div class="csvv-step-indicator">';
            html += '<div class="csvv-step-range"></div>';
            html += '<span class="csvv-step-title">Upload CSV</span>';
            html += '<span class="csvv-step-title">Match Columns</span>';
            html += '<span class="csvv-step-title">Resolve Errors</span>';
            html += '<span class="csvv-step-title">Finished</span>';
        html += '</div>';

        return html;
    }
    
    // ~~ Step 1 : Upload CSV
    var data,
        dataHasHeaders,
        backData = {},
        file,
        minColumnsRequired = 0;

    // Min number of columns
    for (i = 0; i < options.columns.length; i++) {
        if (options.columns[i].required) {
            minColumnsRequired++;
        }
    }
    
    function uploadCSV() {
        
        var html = '';

        html += '<h1 class="csvv-title ' + options.classes.title + '">Step 1</h1>';

        html += stepIndicator(1);

        html += '<div id="csvvDragAndDrop">';
            html += '<input class="csvv-file-upload" id="csvvFileUpload" type="file" accept="text/csv,text/plain">';
            html += '<div class="csvv-drop" id="csvvDrop">';
                html += '<p>Drag & drop or click here to upload a csv.</p>';
            html += '</div>';
        html += '</div>';

        html += '<div class="csvv-checkbox ' + options.classes.checkbox + '">';
            html += '<label>';
                 html += '<input id="csvvHasHeaders" type="checkbox" checked><span>The CSV contains headers</span>';
            html += '</label>';
        html += '</div>';

        html += '<button class="csvv-btn csvv-btn-disabled ' + options.classes.btn + '" id="csvvNext" type="button">Next</button>';
        
        $target.html(html);

        // Next
        $target.off('click', '#csvvNext');
        $target.on('click', '#csvvNext', function() {
            parseCSV();
        });
    }

    function parseCSV() {
        function callback(hideNotify, changeMessage) {
            $target.on('drop', '#csvvDrop', hideNotify);
            $target.on('change', '#csvvFileUpload', hideNotify);
        } 

        if (file) {
            Papa.parse(file, {
                complete: function(results) {
                    if (debug && results.errors.length) {
                        console.log(results.errors);
                    }

                    data = results.data;

                    var maxNumberOfColumns = 0;
                    maxNumberOfColumns = Math.max.apply(Math, $.map(data, function (column) { return column.length; }));

                    if (minColumnsRequired <= maxNumberOfColumns) {
                        // Check if uploaded csv has headers or not (user input)
                        dataHasHeaders = $target.find('#csvvHasHeaders').is(':checked');

                        transition($target, function() {
                            $target.removeClass('csvv-animation-in').addClass('csvv-animation-out');
                        }, function() {
                            matchHeaders();
                        }, function () {
                            $target.removeClass('csvv-animation-out').addClass('csvv-animation-in');
                        });
                    } else {
                        notify('Sorry, the file you have chosen doesn\'t appear to have enough columns.', 'danger', 'notEnoughColumns', '#csvvDragAndDrop', callback);
                    }
                },
                skipEmptyLines: true
            });
        }
    }

    // Show the uploaded filename for confirmation
    function showFileName(filename) {
        $target.find('#csvvFilename').remove();
        $target.find('#csvvNext').removeClass('csvv-btn-disabled');

        var html = '';
        
        html += '<div class="csvv-filename" id="csvvFilename">';
            html += filename;
        html += '</div>';
        
        $target.find('#csvvDragAndDrop').after(html);
    }

    function removeFileName() {
        transition($target.find('#csvvFilename'), function() {
            $target.find('#csvvFilename').addClass('csvv-transition-out');
        }, function() {
            $target.find('#csvvFilename').remove();
        });
        
        $target.find('#csvvNext').addClass('csvv-btn-disabled');
    }

    // Click
    $target.on('click', '#csvvDrop', function() {
        $target.find('#csvvFileUpload').trigger('click');
    });

    // File added
    $target.on('change', '#csvvFileUpload', function(e) {
        file = e.target.files[0];
        if (file) {
            showFileName(file.name);
        } else {
            removeFileName();
        }
    });

    // Drag hover
    $target.on('dragover', '#csvvDrop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('csvv-dragging');
    });

    // Drag leave
    $target.on('dragleave', '#csvvDrop', function() {
        $(this).removeClass('csvv-dragging');
    });

    // Drop
    $target.on('drop', '#csvvDrop', function(e) {
        removeFileName();

        function callback(hideNotify, changeMessage) {
            $target.on('drop', '#csvvDrop', hideNotify);
             $target.on('change', '#csvvFileUpload', hideNotify);
        }
        e.preventDefault();
        e.stopPropagation();
        var data = e.dataTransfer || e.originalEvent.dataTransfer;
        file = data.files[0];
        if (file.type !== 'text/csv' && file.type !== 'text/plain') {
            notify('Sorry, the file you have chosen doesn\'t appear to be a csv or a text file.', 'danger', 'notReadable', '#csvvDragAndDrop', callback);
            file = false;
        } else {
            showFileName(file.name);
        }
    });

    // Initialize step 1
    uploadCSV();
    
    // ~~ Step 2 : Match up headers
    
    function matchHeaders(restore) {
        
        var i,
            ii,
            tempColumns = data;
        
        // Check if any headers are missing
        if (dataHasHeaders) {
            for (i = 0; i < tempColumns[0].length; i++) {
                if (tempColumns[0][i] === '') {
                    tempColumns[0][i] = 404;
                }
            }
        }
        
        // Sort into columns
        var columns = data[0].map(function(col, i) { 
            return data.map(function(row) { 
                return row[i];
            });
        });
    
        // Header select
        function headerSelect(header, columnCount) {
            var html = '';
            html += '<select class="csvv-header-select ' + options.classes.select + '">';
                html += '<option value="">---</option>';
                for (var i = 0; i < options.columns.length; i++) {
                    
                    var currentHeader = options.columns[i];
                    var selected = '';
                    if (typeof header === 'string') {
                        header = header.toLowerCase().replace(/[^\w]+/g, '');
                    }
                    
                    var currentKeywords,
                        keywordMatch = false;
                    if (currentHeader.keywords) {
                        currentKeywords = currentHeader.keywords.toLowerCase().replace(/[^\w,]+/g, '').split(',');
                        if (currentKeywords.indexOf(header) !== -1) {
                            keywordMatch = true;
                        }
                    }
                    
                    if (restore) {
                        if (restore[columnCount] === currentHeader.name) {
                            selected = 'selected';
                        }
                    } else {
                        if ((header === currentHeader.name.toLowerCase().replace(/[^\w]+/g, '') || keywordMatch) && dataHasHeaders) {
                            selected = 'selected';
                        }
                    }
                    currentKeywords = false;
                    
                    html += '<option value="' + currentHeader.name + '" ' + selected + '>' + currentHeader.name + '</option>';
                }
            html += '</select>';
            return html;
        }
        
        // Output
        var html = '';
        
        // How many examples to show (existing header counts as an example)
        var exampleValueLength;
        if (dataHasHeaders) {
            exampleValueLength = 4;
        } else {
            exampleValueLength = 3;
        }
        
        html += '<h1 class="csvv-title ' + options.classes.title + '">Step 2</h1>';

        html += stepIndicator(2);

        html += '<div id="csvvHeaderBlockList" class="csvv-header-block-list">';
        
        for (i = 0; i < columns.length; i++) {
            
            columns[i] = columns[i].filter(function(value) {
                if (value !== undefined && value !== '') {
                    return value;
                }
            });

            html += '<div class="csvv-header-block">';
                
            for (ii = 0; ii < exampleValueLength && ii < columns[i].length; ii++) {
                if (ii === 0) {
                    html += '<div class="csvv-header-row csvv-header-row-select">';
                        html += headerSelect(columns[i][ii], i);
                        html += '<p>Choose what header this column belongs to</p>';
                    html += '</div>';
                    if (dataHasHeaders) {
                        if (columns[i][ii] === 404) {
                            html += '<div class="csvv-header-row csvv-header-row-original csvv-header-row-original-missing">';
                                html += '(No header)';
                            html += '</div>';
                        } else {
                            html += '<div class="csvv-header-row csvv-header-row-original">';
                                html += columns[i][ii];
                            html += '</div>';
                        }
                    }
                    else {
                        html += '<div class="csvv-header-row">';
                            html += columns[i][ii];
                        html += '</div>';
                    }
                } else {
                    html += '<div class="csvv-header-row">';
                        html += columns[i][ii];
                    html += '</div>';
                }
            }
            html += '</div>';
        }

        html += '</div>';
        
        html += '<div class="csvv-btn-group">';
        html += '<button class="csvv-btn ' + options.classes.btn + '" id="csvvBack" type="button">Back</button>';
        html += '<button class="csvv-btn ' + options.classes.btn + '" id="csvvNext" type="button">Next</button>';
        html += '</div>';
        
        $target.html(html);

        // Make sure there are no duplicate headers
        $target.off('change', '.csvv-header-select');
        $target.on('change', '.csvv-header-select', function() {
            var selectedHeader = $(this).val();
            $('.csvv-header-select').not(this).each(function() {
                if ($(this).val() === selectedHeader) {
                    $(this).val('');
                }
            });
        });

        function backToStep1() {
            transition($target, function() {
                $target.removeClass('csvv-animation-in').addClass('csvv-animation-out');
            }, function() {
                uploadCSV();
            }, function () {
                $target.removeClass('csvv-animation-out').addClass('csvv-animation-in');
            });
        }
        
        // Back
        $target.off('click', '#csvvBack');
        $target.on('click', '#csvvBack', function() {
            confirm('Are you sure you want to go back? Any information from this step will be lost.', 'Go back', backToStep1);
        });
        
        // Next
        $target.off('click', '#csvvNext');
        $target.on('click', '#csvvNext', function() {
            validateHeaders();
        });
    }
    
    function validateHeaders() {
        
        // Check required columns are selected
        function requiredColumns() {
            var error = [];
            var headerValues = $('.csvv-header-select').map(function() {
                return $(this).val();
            }).get();
            
            
            for (var i = 0; i < options.columns.length; i++) {
                if (options.columns[i].required === true && headerValues.indexOf(options.columns[i].name) === -1) {
                    error.push(options.columns[i].name);
                }
            }
            
            if (error.length > 0) {
                return 'The following columns are required and have not been selected: ' + error.join(', ');
            } else {
                return false;
            }
        }
        
        // Check for unmatched columns
        function unmatchedColumns() {
            var headerValues = $('.csvv-header-select').map(function() {
                return $(this).val();
            }).get();
        
            // Length of unselected columns
            var unselectedColumns = headerValues.filter(function(v) {
                return v === '';
            });
            
            unselectedColumns = unselectedColumns.length;
        
            // Length of unselected headers
            var unselectedHeaders = options.columns.length - headerValues.length + unselectedColumns;
            
            if (unselectedColumns > 0 && unselectedHeaders > 0) {
                return 'There are some columns that have not been matched up, are you sure you want to continue?';
            } else {
                return false;
            }
        }
        
        // Callback for Notify
        function editNotify(hideNotify, changeMessage) {
            $target.on('change', '.csvv-header-select', function() {
                var error = requiredColumns();
                if (error) {
                    changeMessage(error);
                } else {
                    hideNotify();
                }
            });
        }
        
        // Validate headers success
        function validateHeadersSucess() {
            var headerValues = $('.csvv-header-select').map(function() {
                return $(this).val();
            }).get();
            
            var rowStart;
            if (dataHasHeaders) {
                rowStart = 1;
            } else {
                rowStart = 0;
            }
            
            var results = [];
            var headerOrder = headerValues.filter(function(v) {
                return v !== undefined && v !== '';
            });
            results.push(headerOrder);
            
            for (var i = rowStart; i < data.length; i++) {
                var resultColumn = {};
                for (var ii = 0; ii < headerValues.length; ii++) {
                    // Check to see if that column has been assigned a header
                    if (headerValues[ii]) {
                        // Check to see if content for the column exists
                        if (data[i][ii]) {
                            resultColumn[headerValues[ii]] = data[i][ii];
                        } else {
                            resultColumn[headerValues[ii]] = '';
                        }
                    }
                }
                results.push(resultColumn);
            }
            
            backData.step2 = headerValues;

            transition($target, function() {
                $target.removeClass('csvv-animation-in').addClass('csvv-animation-out');
            }, function() {
                validateRows(results);
            });
        }
        
        var error = requiredColumns();
        var warning = unmatchedColumns();
        
        if (error) {
            notify(error, 'danger', 'requiredColumns', '#csvvHeaderBlockList', editNotify);
        } else if (warning) {
            confirm(warning, 'Continue', validateHeadersSucess);
        } else {
            validateHeadersSucess();
        }
    }
    
    // ~~ Step 3 : Validate rows
    
    function validateRows(data) {
        
        var completedData = [],
            numberOfErrors = 0;

        function checkInput(input) {

            var $input = $(input),
                result = validateInput($input.val(), $input.data('required'), $input.data('cell-type'), $input.data('min-length')),
                cellType = $input.data('cell-type'),
                cellMinLength = $input.data('min-length'),
                previousMessages = [],
                currentMessages = [],
                html = '',
                outcome;

            $input.siblings('.csvv-validation-column-message.csvv-transition-out').remove();
            $input.siblings('.csvv-validation-column-message:not(.csvv-transition-out)').each(function() {
                var reason = $(this).data('reason');
                previousMessages.push(reason);
            });

            if (result.valid) {
                $input.removeClass('csvv-validation-column-input-fail ' + options.classes.inputFail).addClass('csvv-validation-column-input-success ' + options.classes.inputSuccess);
                outcome = true;
            } else {
                $input.removeClass('csvv-validation-column-input-success ' + options.classes.inputSuccess).addClass('csvv-validation-column-input-fail ' + options.classes.inputFail);
                outcome = false;
            }

            for (var i = 0; i < result.failed.length; i++) {
                currentMessages.push(result.failed[i]);

                // Check to see if the message is already there
                if (previousMessages.indexOf(result.failed[i]) === -1) {
                    html += '<div class="csvv-validation-column-message" data-reason="' + result.failed[i] + '">';
                        if (result.failed[i] === 'required') {
                            html += options.messages.required;
                        } else if (result.failed[i] === 'type') {
                            if (cellType === 'email') {
                                html += options.messages.email;
                            } else if (cellType === 'number') {
                                html += options.messages.number;
                            } else if (cellType === 'date') {
                                html += options.messages.date.replace('[dateFormat]', options.dateFormat);
                            } 
                        } else {
                            html += options.messages.minLength.replace('[minLength]', cellMinLength);
                        }
                    html += '</div>';
                }
            }
            $input.siblings('.csvv-validation-column-message').each(function() {
                // Check to see if the message needs removing
                if (currentMessages.indexOf($(this).data('reason')) === -1) {
                    var $html = $(this);
                    transition($html, function() {
                        $html.addClass('csvv-transition-out');
                    }, function() {
                        $html.remove();
                    });
                }
            });
            $input.after(html);

            return outcome;
        }
        
        function checkNextRow(i) {
            
            // Check if row exists
            if (validatedData[i]) {
                
                // Check if row passed
                if (validatedData[i].validation === 'passed') {
                    // Add data to completedData
                    var rowData = {};
                    for (var header in validatedData[i].content) {
                        if (validatedData[i].content.hasOwnProperty(header)) {
                            rowData[header] = validatedData[i].content[header].value;
                        }
                    }
                    completedData.push(rowData);

                    // Check next row
                    checkNextRow(++i);
                } else {
                    var htmlRow = '';

                    htmlRow += '<div class="csvv-validation-column-list">';
                    
                    for (var ii = 0; ii < data[0].length; ii++) {
                        var columnName = data[0][ii];
                        var cell = validatedData[i].content[columnName];
                        var cellValue = cell.value;
                        var cellValidation = cell.validation;
                        var cellType = '';

                        if (cellValidation.cellType === 'number') {
                            cellType = 'csvv-input-number';
                        } else if (cellValidation.cellType === 'date') {
                            cellType = 'csvv-input-date';
                        }

                        htmlRow += '<div class="csvv-validation-column">';
                            htmlRow += '<label class="csvv-validation-column-heading" for="' + data[0][ii].toLowerCase() + '">' + data[0][ii] + '</label>';
                        
                            htmlRow += '<input class="csvv-validation-column-input ' + cellType + ' ' + options.classes.input + '" id="' + data[0][ii].toLowerCase() + '" value="' + cellValue + '" data-name="' + columnName + '" data-cell-type="' + cellValidation.cellType + '" data-min-length="' + cellValidation.minLength + '" data-required="' + cellValidation.required + '">';
                        htmlRow += '</div>';
                    }

                    htmlRow += '</div>';

                    htmlRow += '<button class="csvv-btn csvv-btn-danger ' + options.classes.btn + ' ' + options.classes.btnDanger + '" id="csvvRemoveRow" type="button">Remove</button>';
                    htmlRow += '<button class="csvv-btn csvv-btn-disabled ' + options.classes.btn + '" id="csvvResolveError" type="button">Resolve</button>';

                    if (numberOfErrors > 0) {
                        htmlRow += '<p class="csvv-validation-error-count">' + (numberOfErrors) + ' row' + (numberOfErrors > 2 ? 's' : '') +' left to resolve.</p>';
                    }

                    if ($target.hasClass('csvv-animation-in')) {
                        var $csvvValidation = $target.find('#csvvValidation');
                        transition($csvvValidation, function() {
                            $csvvValidation.removeClass('csvv-animation-in').addClass('csvv-animation-out');
                        }, function() {
                            $csvvValidation.data('index', i).html(htmlRow);
                            $csvvValidation.find('.csvv-validation-column-input').each(function() {
                                checkInput(this);
                            });
                        }, function() {
                            $csvvValidation.removeClass('csvv-animation-out').addClass('csvv-animation-in');
                        });
                    } else {
                        $target.find('#csvvValidation').data('index', i).html(htmlRow);
                        $target.find('.csvv-validation-column-input').each(function() {
                            checkInput(this);
                        });
                        $target.removeClass('csvv-animation-out').addClass('csvv-animation-in');
                    }
                }
            } else {
                // Finish
                if ($target.hasClass('csvv-animation-in')) {  
                    transition($target, function() {
                        $target.removeClass('csvv-animation-in').addClass('csvv-animation-out');
                    }, function() {
                        finish(completedData);
                    }, function() {
                        $target.removeClass('csvv-animation-out').addClass('csvv-animation-in');
                    });
                } else { 
                    finish(completedData);
                    $target.removeClass('csvv-animation-out').addClass('csvv-animation-in');
                }
            }
        }

        
        
        // Validation headers
        var validationHeaders = {},
            validatedData = [data[0]];
        
        for (i = 0; i < options.columns.length; i++) {
            validationHeaders[options.columns[i].name] = options.columns[i];
        }
        
        // Validate data - loop through rows
        for (i = 1; i < data.length; i++) {
            
            var validatedRow = {},
                failed = false;
            
            // Loop through cells
            for (var ii = 0; ii < data[0].length; ii++) {
                
                var column = data[0][ii],
                    value = data[i][column],
                    vRequired = validationHeaders[column].required,
                    vType = validationHeaders[column].type,
                    vMinLength = validationHeaders[column].minLength;

                if (!validateInput(value, vRequired, vType, vMinLength).valid) {
                    failed = true;
                }
                
                validatedRow[column] = {
                    value: value,
                    validation: {
                        required: vRequired,
                        cellType: vType,
                        minLength: vMinLength
                    }
                };
            }
            
            var validationResult;
            if (failed) {
                validationResult = 'failed';
                numberOfErrors++;
            } else {
                validationResult = 'passed';
            }
            
            validatedData.push({
                content: validatedRow,
                validation: validationResult
            });
        }
        
        var html = '';
        html += '<h1 class="csvv-title ' + options.classes.title + '">Step 3</h1>';

        html += stepIndicator(3);
        
        html += '<div id="csvvValidation"></div>';
        
        html += '<button class="csvv-btn ' + options.classes.btn + '" id="csvvBack" type="button">Back</button>';
        
        $target.html(html);

        // On input change check all inputs
        $target.off('input', '.csvv-validation-column-input');
        $target.on('input', '.csvv-validation-column-input', function() {
            var passed = true;
            $target.find('.csvv-validation-column-input').each(function() {
                if (!checkInput(this)) {
                    passed = false;
                }
            });

            if (passed) {
                $target.find('#csvvResolveError').removeClass('csvv-btn-disabled');
            } else {
                $target.find('#csvvResolveError').addClass('csvv-btn-disabled');
            }
        });

        // Resolve error and add to completed data
        $target.off('click', '#csvvResolveError');
        $target.on('click', '#csvvResolveError', function() {
            var passed = true;
            var rowData = {};
            $target.find('.csvv-validation-column-input').each(function() {
                if (!checkInput(this)) {
                    passed = false;
                } else {
                    rowData[$(this).data('name')] = $(this).val();
                }
            });

            if (passed) {
                var index = $target.find('#csvvValidation').data('index');
                numberOfErrors--;

                // Add data to completed data
                completedData.push(rowData);
                checkNextRow(++index);
            }
        });

        // Remove row from data
        $target.off('click', '#csvvRemoveRow');
        $target.on('click', '#csvvRemoveRow', function() {
            var index = $target.find('#csvvValidation').data('index');

            confirm('Are you sure you want to remove this row?', 'Remove', function() {
                numberOfErrors--;
                checkNextRow(++index);
            });
        });

        $target.on('keypress', '.csvv-validation-column-input', function(e) {
            if (e.keyCode === 13) {
                $target.find('#csvvResolveError').trigger('click');
            }
        });
        
        // Add headers to completed data
        completedData[0] = data[0];
        
        // Start checking rows
        checkNextRow(1);

        // Back
        $target.off('click', '#csvvBack');
        $target.on('click', '#csvvBack', function() {
            confirm('Are you sure you want to go back? Any information from this step will be lost.', 'Go back', function() {
                matchHeaders(backData.step2);
            });
        });
        
    }
    
    // ~~ Step 4 : Output results
    function finish(completedData) {

        var data = {},
            tempArray;

        // Object
        data.object = completedData;

        // Array
        data.array = [
            completedData[0]
        ];

        for (var i = 1; i < completedData.length; i++) {
            tempArray = [];
            for (var ii = 0; ii < completedData[0].length; ii++) {
                tempArray.push(completedData[i][completedData[0][ii]]);
            }
            data.array.push(tempArray);
        }

        // CSV
        data.csv = '';

        for (i = 0; i < data.array.length; i++) {
            data.csv += data.array[i].join(',') + '\n';
        }

        callback(data);

        var html = '';
        html += '<h1 class="csvv-title ' + options.classes.title + '">All finished, thanks!</h1>';

        html += stepIndicator(4);
        
        $target.html(html);
    }
};
