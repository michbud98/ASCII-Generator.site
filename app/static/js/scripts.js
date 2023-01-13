$(document).ready(function () {
    // Turn on tippy.js tooltips
    tippy('[data-tippy-content]');

    // Put jQuery selector to display
    function animate_fade_in(elem, speed = 750, delay = 0) {
        setTimeout(function () {
            elem.css({'opacity': 0});
            elem.removeClass('hide');
            elem.animate({'opacity': 1}, speed);
        }, delay);
    }

    // Put jQuery selector to hide
    function animate_fade_out(elem, speed = 750, delay = 0, delete_after = false) {
        elem.delay(delay).animate({'opacity': 0}, speed, 'swing', function () {
            if (delete_after) {
                elem.remove();
            } else {
                elem.addClass('hide');
                elem.css({'opacity': 1});
            }
        });
    }

    // Mobile menu script
    $('header .mobile-menu-btn').click(function () {
        $('header .mobile-menu').toggleClass('menu--open');
        $('.mobile-menu-btn').toggleClass('menu-btn--on');
        $('body').toggleClass('overflowHidden')
    });

    // Switch url link depending on what input type is selected ("/" for img, "t/" for txt)
    function switch_url_by_input(mode = '') {
        if (mode === 'img') {
            window.history.replaceState({}, 'img2ascii', img2ascii_relative_link)
        } else if (mode === 'txt') {
            window.history.replaceState({}, 'txt2ascii', txt2ascii_relative_link)
        }
    }

    // Display input method depending on what text in header is underlined
    function switch_input_type() {
        const input_type_switcher_all_p = $('header .switcher').find('p');
        const input_type_img = $('section.index .img2ascii-input');
        const input_type_txt = $('section.index .txt2ascii-input');
        input_type_img.addClass('hide');
        input_type_txt.addClass('hide');
        if ($(input_type_switcher_all_p.get(0)).hasClass('chosen')) {
            animate_fade_in(input_type_img);
            switch_url_by_input('img')
        } else if ($(input_type_switcher_all_p.get(1)).hasClass('chosen')) {
            animate_fade_in(input_type_txt);
            switch_url_by_input('txt')
        }

    }

    // Switch underline on p's in header
    $('header .switcher').on('click', 'p', function () {
        if ($('header .switcher').find('.chosen').length > 0) {
            if ($(this).hasClass('chosen') === false) {
                $('header .switcher').find('p').each(function () {
                    $(this).toggleClass('chosen')
                });
                switch_input_type();
            }
        }
    });

    // Switch underline on p's in header (if clicked on small text below input method)
    $('section.index').on('click', 'p.ps-tiny', function () {
        $('header .switcher').find('p').each(function () {
            $(this).toggleClass('chosen')
        });
        switch_input_type();
    });

    // Display and hide language switch window if language clicked in footer
    $('footer').on('click', '.language-switcher', function () {
        const language_switcher_window = $('footer .language-switcher .language-switcher-window');
        if (language_switcher_window.hasClass('hide')) {
            animate_fade_in(language_switcher_window, 250);
        } else {
            animate_fade_out(language_switcher_window, 150);
        }
    });

    // Switch language by clicking one
    $('footer .language-switcher-window').on('click', 'span', function () {
        const language_form = $('footer #language-form');
        const language_input = $('footer #language-input');
        language_input.val($(this).data('language'));
        window.history.pushState(
            {},
            local_language_code_i18n,
            window.location.href.replace("/" + local_language_code_i18n + "/", "/")
        );
        language_form.submit();
    });

    const current_user_agreement = 'user_agreed_v2';

    // Display agreements if 'Agreement - user_agreed_vX' cookie is not found
    if (Cookies.get('Agreement') !== current_user_agreement) {
        animate_fade_in($('.agreements'), 200, 1000);
    }

    // If "I Agree" button is clicked in agreements, hide message and set cookie 'Agreement - user_agreed_vX'
    $('.agreements').on('click', 'input[type=button]', function () {
        Cookies.set('Agreement', current_user_agreement, {expires: 365});
        animate_fade_out($('.agreements'), 0);
    });

    // Send ajax-request for feedback form
    $('section.feedback').on('submit', 'form.feedback-form', function () {
        const cur_elem = $(this);
        cur_elem.find('p.error').remove();

        const placement = cur_elem.offset().top + (cur_elem.height() / 2) - 56;
        cur_elem.find('input[type=submit]').attr('disabled', '');
        $('body').append( // animated loading circle
            '<div class="circle-loader-div" style="top: ' + placement + 'px">\n' +
            '    <div class="circle-loader">\n' +
            '        <div class="checkmark draw"></div>\n' +
            '    </div>\n' +
            '</div>'
        );

        $.ajax({
            url: cur_elem.attr('action'),
            type: 'POST',
            data: cur_elem.serialize(),
            error: function (response) {
                const errors = response.responseJSON['errors'];
                let error_obj = errors['text'];
                if (error_obj) {
                    for (let key in Object.keys(error_obj)) {
                        cur_elem.find('#id_text').after(
                            '<p class="error">' + error_obj[key] + '</p>'
                        )
                    }
                }
                error_obj = errors['email'];
                if (error_obj) {
                    for (let key in Object.keys(error_obj)) {
                        cur_elem.find('#id_email').after(
                            '<p class="error">' + error_obj[key] + '</p>'
                        )
                    }
                }
                error_obj = errors['captcha'];
                if (error_obj) {
                    for (let key in Object.keys(error_obj)) {
                        cur_elem.find('#id_captcha').after(
                            '<p class="error">' + error_obj[key] + '</p>'
                        )
                    }
                }
                error_obj = errors['agreement'];
                if (error_obj) {
                    for (let key in Object.keys(error_obj)) {
                        cur_elem.find('#id_agreement + label').after(
                            '<p class="error">' + error_obj[key] + '</p>'
                        )
                    }
                }
                $('.circle-loader').css({'border-color': '#ff2635'});
                animate_fade_out($('.circle-loader-div'), 250, 250, true);
            },
            success: function (response) {
                cur_elem[0].reset();
                $('.circle-loader').toggleClass('load-complete');
                $('.circle-loader .checkmark').toggle();
                animate_fade_out($('.circle-loader-div'), 500, 1000, true);
            },
            complete: function (response) {
                cur_elem.find('input[type=submit]').removeAttr('disabled');
                grecaptcha.reset();
            }
        });
        return false
    });

    // Ajax image uploader
    let fileUploadEnabled = true;

    const init_uploader = function () {
        const fileInputElement = document.querySelector('.js-file__input');
        const fileDropZone = document.querySelector('.js-dropzone');

        // Prevents the default behavior of refresh
        // Force click on the input element
        document.querySelector('.file__input-label-button').addEventListener('click', function (e) {
            e.preventDefault();
            fileInputElement.click();
        });

        // Handle Creating Elements for the files using the Browse button
        fileInputElement.addEventListener('change', function (e) {
            if (fileUploadEnabled) {
                const validatedFiles = fileValidation([...fileInputElement.files]);
                if (validatedFiles[0]) {
                    uploadFile(validatedFiles[0]);
                }
            }
        });

        // Prevents default behavior of automatically opening the file
        fileDropZone.addEventListener('dragover', function (e) {
            $(fileDropZone).addClass('hovered');
            e.preventDefault();
        });

        fileDropZone.addEventListener('dragenter', function() {
            $(fileDropZone).addClass('hovered');
        });

        fileDropZone.addEventListener('dragleave', function() {
            $(fileDropZone).removeClass('hovered');
        });

        // Gets node element list of files Converts them to a list of Arrays
        // Then calls createFileDOMNode to create DOM Element of the files
        fileDropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            if (fileUploadEnabled) {
                const unvalidatedFiles = getArrayOfFileData([...e.dataTransfer.items]);
                const validatedFiles = fileValidation(unvalidatedFiles);
                if (validatedFiles[0]) {
                    uploadFile(validatedFiles[0]);
                }
            }
        });
    };

    // Upload File ajax request
    const uploadFile = function (file, hidden=false) {
        fileUploadEnabled = false;
        const fileInputElement = $('.js-file__input');
        const fileDropZone = $('section.index .js-dropzone');
        const fileUploadModal = $('section.index .file-upload__modal');
        const asciiImageOutput = $('section.index .ascii-image-output');
        const csrf_token = fileDropZone.find('input[name="csrfmiddlewaretoken"]').val();
        let data = new FormData();
        data.append('img', file);

        if (!(hidden)) {
            const placement = fileDropZone.offset().top - 25;
            $('body').append( // animated loading circle
                '<div class="circle-loader-div" style="top: ' + placement + 'px">\n' +
                '    <div class="circle-loader">\n' +
                '        <div class="checkmark draw"></div>\n' +
                '    </div>\n' +
                '</div>'
            );
        }



        $.ajax({
            url: fileDropZone.attr('action'),
            type: 'POST',
            data: data,
            processData: false,
            contentType: false,
            headers: {
                'X-CSRFToken': csrf_token,
            },
            error: function (response) {
                $('.circle-loader').css({'border-color': '#ff2635'});
                animate_fade_out($('.circle-loader-div'), 250, 250, true);
            },
            success: function (response) {
                $('.circle-loader').toggleClass('load-complete');
                $('.circle-loader .checkmark').toggle();
                animate_fade_out($('.circle-loader-div'), 500, 1000, true);
                const arts = response.arts;
                generated_image_ascii = {};
                for (let i in arts) {
                    generated_image_ascii[i] = arts[i].replace(new RegExp("&" + "#" + "x27;", "g"), "'");
                }
                change_font_size_on_art(true);
                update_displayed_image(file, response.file_name);
                update_displayed_image_options(response);

                fileUploadModal.addClass('hide');
                asciiImageOutput.removeClass('hide');
                update_displayed_image_art();
            },
            complete: function (response) {
                fileInputElement.val('');
                fileUploadEnabled = true;
            }
        });
    };

    // Validates each file that it is the format we accept
    // Then pushes the validated file to a new array
    const fileValidation = function (files) {
        const errMessageOutput = document.querySelector('.file-upload__error');
        const validatedFileArray = [];
        const supportedExts = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'ico', 'webp'];
        files.forEach(file => {
            const ext = getFileExtension(file);
            if (file.size > 5242880) {
                let errMessage = gettext('Maximum size is 5 MB.');
                errMessageOutput.style.display = 'block';
                errMessageOutput.textContent = errMessage;
            } else if (supportedExts.indexOf(ext) === -1) {
                let errMessage =
                    gettext('Supported formats are: .png, .jpg, .bmp, .gif, .ico, .webp.');
                errMessageOutput.style.display = 'block';
                errMessageOutput.textContent = errMessage;
                // return '';
            } else {
                errMessageOutput.style.display = 'none';
                validatedFileArray.push(file);
            }
        });
        return validatedFileArray;
    };

    // Returns an array of the file data
    const getArrayOfFileData = function (files) {
        const fileDataArray = [];
        files.forEach(file => {
            if (file.kind === 'file') {
                fileDataArray.push(file.getAsFile());
            }
        });
        return fileDataArray;
    };

    // Returns the files type extension
    const getFileExtension = function (file) {
        return file.name.split('.').pop().toLowerCase();
    };

    // Truncates a string if too long
    const truncateString = function (str, num) {
        if (str.length > num) {
            return str.slice(0, num) + '...';
        } else {
            return str;
        }
    };

    init_uploader();

    // Update displayed options on ascii art
    function update_displayed_image_options(response_dict) {
        const options_container = $('section.index .ascii-image-output .options_container');
        options_container.find('#option_num_cols').val(response_dict.num_cols);
        options_container.find('#option_brightness').val(response_dict.brightness);
        options_container.find('#option_contrast').val(response_dict.contrast);
    }

    // Update displayed image on ascii art
    function update_displayed_image(file, file_name) {
        const reader = new FileReader();
        const image = $('section.index .ascii-image-output .image img');
        const art_div = $('section.index .ascii-image-output .ascii-art');
        reader.onload = function (e) {
            image.attr('src', e.target.result);
        };
        reader.readAsDataURL(file);
        image.data('file_name', file_name);
    }

    // Switch image ascii art
    function update_displayed_image_art(adapt=true, limit_width=true) {
        const slider_window = $('section.index .ascii-image-output .slider-window');
        const art_div = $('section.index .ascii-image-output .ascii-art');
        art_div.css({
            'letter-spacing': 'unset',
            'line-height': 'unset',
            'transform': 'unset'
        });
        const art_id = $('section.index .ascii-image-output .buttons.second_row .chosen').data('method_id');
        const art = generated_image_ascii[art_id];
        const image = $('section.index .ascii-image-output .image img');
        art_div.text(art);
        // If client is on Chrome, change some styles of second ASCII-art
        if (window.chrome && parseInt(art_id) === 1) {
           art_div.css({
               'letter-spacing': '-0.1em',
               'line-height': '1.2em',
               'transform': 'scale(1.2, 1) translateX(8%)'
           });
            slider_window.css('width', parseFloat(art_div.css('width')) * 1.2 + 6);
        } else {
            slider_window.css('width', parseFloat(art_div.css('width')) + 6);
        }
        slider_window.css('height', parseFloat(art_div.css('height')) + 6);
        // Also update image size
        image.css('width', parseFloat(slider_window.css('width')));
        image.css('height', parseFloat(art_div.css('height')));
        if (adapt) {
            resize_ascii_image_art(limit_width);
        }
    }

    // Change font-size on image ASCII-art
    function change_font_size_on_art(revert = false, symbol = '?') {
        const art_div = $('section.index .ascii-image-output .ascii-art');
        const span_font_size_number = $('section.index .ascii-image-output span.font-size_number');
        let font_size = parseInt(art_div.css('font-size'));
        if (revert) {
            font_size = 12  // Default font-size
        } else {
            if (symbol === '+') {
                font_size += 1
            } else if (symbol === '-' && font_size > 1) {
                font_size -= 1
            }
        }
        art_div.css('font-size', font_size);
        span_font_size_number.text(font_size);
        update_displayed_image_art(true, false);
    }

    $('section.index .ascii-image-output .container_slider').on('click', 'input[type=button]', function () {
        change_font_size_on_art(false, $(this).val());
    });

    // Switch chosen method by clicking on methods numbers
    $('section.index .ascii-image-output .buttons.second_row').on('click', 'div', function () {
        if ($(this).hasClass('chosen') === false) {
            $('section.index .ascii-image-output .buttons.second_row').find('div').removeClass('chosen');
            $(this).addClass('chosen');
            update_displayed_image_art(true, false)
        }
    });

    // Invert colors of ascii-image-output
    $('section.index .ascii-image-output').on('click', '.invert_colors img', function () {
        $('section.index .ascii-image-output .slider-window').toggleClass('invert');
    });

    // Copy to clipboard ascii-image-output
    $('section.index .ascii-image-output').on('click', '.copy_to_clipboard img', function () {
        $(this).after('<textarea id="textarea_to_copy" ' +
            'style="opacity: 0; position: absolute; height: 5; width: 5;">' + $('section.index .ascii-image-output .ascii-art').text() + '</textarea>');
        let textarea_to_copy = $('section.index #textarea_to_copy');
        try {
            textarea_to_copy.select();
            document.execCommand('copy');
        } catch (e) {
            console.error(e)
        }
        textarea_to_copy.remove();
        window.getSelection().removeAllRanges();
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection) {  // IE?
            document.selection.empty();
        }
    });

    // Bring back image upload form by clicking "New image" btn
    $('section.index .ascii-image-output').on('click', '.new_file img', function () {
        img2ascii_relative_link = '/';
        switch_url_by_input('img');
        remove_report_button_from_img();

        $('section.index .ascii-image-output').addClass('hide');
        animate_fade_in($('section.index .file-upload__modal'));
    });

    // function to convert dataurl into a file
    function dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
}

    // Ajax request to update image with new settings
    $('section.index .ascii-image-output .options_container form').submit(function () {
        const cur_elem = $(this);
        const submit_btn = cur_elem.find('input[type=submit]');
        const cur_ascii_img = $('section.index .ascii-image-output .image img');
        const loading_twirl = $('section.index .ascii-image-output .loading_twirl');
        const option_inputs = $('section.index .ascii-image-output .options_grid input[type=text]');
        let data = cur_elem.serialize();
        data += '&file_name=' + cur_ascii_img.data('file_name');
        option_inputs.attr('disabled', '');
        submit_btn.attr('disabled', '');
        submit_btn.css({'color': 'transparent'});
        animate_fade_in(loading_twirl, 200);


        $.ajax({
            url: cur_elem.attr('action'),
            type: 'POST',
            data: data,
            error: function (response) {
                if (response['status'] === 410) {
                    const file = dataURLtoFile(cur_ascii_img[0].src, cur_ascii_img.data('file_name'));
                    uploadFile(file, true);
                }
            },
            success: function (response) {
                const arts = response.arts;
                generated_image_ascii = {};
                for (let i in arts) {
                    generated_image_ascii[i] = arts[i].replace(new RegExp("&" + "#" + "x27;", "g"), "'");
                }
                update_displayed_image_art();
                update_displayed_image_options(response);
            },
            complete: function () {
                option_inputs.removeAttr('disabled');
                submit_btn.removeAttr('disabled style');
                animate_fade_out(loading_twirl, 50)
            }
        });
        return false
    });

    // Invert colors of ascii-text-output textarea
    $('section.index .ascii-text-output').on('click', '.invert_colors img', function () {
        $('section.index .ascii-text-output textarea[name="output"]').toggleClass('invert');
    });

    // Copy to clipboard ascii-text-output textarea
    $('section.index .ascii-text-output').on('click', '.copy_to_clipboard img', function () {
        $('section.index .ascii-text-output textarea[name="output"]').select();
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection) {  // IE?
            document.selection.empty();
        }
    });

    // Update displayed ASCII art in output textarea
    function update_displayed_text_art() {
        const textarea = $('section.index .ascii-text-output textarea[name="output"]');
        const resize_div = $('section.index #ascii-text-output-resize-textarea');
        textarea.text(generated_text_ascii[$('section.index .ascii-text-output #select-method').val()]);
        textarea.css({'width': '100%'});
        resize_div.width(0).css({'width': 'unset', 'max-width': textarea[0].scrollWidth + 2});
        if ($('section.index .wrapper').width() > resize_div.width()) {
            textarea.height(0).height(textarea[0].scrollHeight - 20);
        } else {
            textarea.height(0).height(textarea[0].scrollHeight - 3);
        }


        window.scrollBy(0, document.body.scrollHeight);
    }

    // Choose previous option in selector
    $('section.index .ascii-text-output').on('click', '.back img', function () {
        const selector_elem = $('section.index .ascii-text-output #select-method');
        if (parseInt(selector_elem.val()) > 0) {
            selector_elem.val(parseInt(selector_elem.val()) - 1);
            update_displayed_text_art();
        }
    });

    // Choose next option in selector
    $('section.index .ascii-text-output').on('click', '.forward img', function () {
        const selector_elem = $('section.index .ascii-text-output #select-method');
        if (generated_text_ascii[parseInt(selector_elem.val()) + 1]) {
            selector_elem.val(parseInt(selector_elem.val()) + 1);
            update_displayed_text_art();
        }
    });

    // Randomize option in selector
    $('section.index .ascii-text-output').on('click', '.randomize img', function () {
        const selector_elem = $('section.index .ascii-text-output #select-method');
        const rnd_min = parseInt(selector_elem.find('option').first().val());
        const rnd_max = parseInt(selector_elem.find('option').last().val());
        selector_elem.val(Math.floor(Math.random() * (rnd_max - rnd_min + 1)) + rnd_min);
        update_displayed_text_art();
    });

    // When other method is selected, call update_displayed_text_art
    $('section.index .ascii-text-output #select-method').change(update_displayed_text_art);

    // Text to ASCII ajax request
    $('section.index .txt2ascii-input form.txt2ascii-form').submit(function () {
        const cur_elem = $(this);
        const output_div = $('section.index .ascii-text-output');

        txt2ascii_relative_link = '/t/';
        switch_url_by_input('txt');
        remove_report_button_from_txt();

        const placement = cur_elem.offset().top + 10;
        cur_elem.find('input[type=submit]').attr('disabled', '');
        $('body').append( // animated loading circle
            '<div class="circle-loader-div" style="top: ' + placement + 'px">\n' +
            '    <div class="circle-loader">\n' +
            '        <div class="checkmark draw"></div>\n' +
            '    </div>\n' +
            '</div>'
        );

        $.ajax({
            url: cur_elem.attr('action'),
            type: 'POST',
            data: cur_elem.serialize(),
            error: function (response) {
                $('.circle-loader').css({'border-color': '#ff2635'});
                animate_fade_out($('.circle-loader-div'), 250, 250, true);
                output_div.addClass('hide');
            },
            success: function (response) {
                const select_elem = output_div.find('#select-method');
                const results = response.results;
                generated_text_ascii = {};
                select_elem.find('option').remove();
                for (let i in results) {
                    select_elem.append('<option value="' + i + '">' + results[i][0] + '</option>');
                    generated_text_ascii[i] = results[i][1].replace(new RegExp("&" + "#" + "x27;", "g"), "'")
                }
                output_div.removeClass('hide');
                update_displayed_text_art();
                $('.circle-loader').toggleClass('load-complete');
                $('.circle-loader .checkmark').toggle();
                animate_fade_out($('.circle-loader-div'), 500, 1000, true);
            },
            complete: function (response) {
                cur_elem.find('input[type=submit]').removeAttr('disabled');
            }
        });
        return false;
    });

    // Screenshot and save image ASCII-art
    $("#button_art_download").click(function () {
        window.scrollTo(0, 0);
        $('.slider-window').addClass("overflowVisible");
        const art_download = $('#art_download');
        const old_font_size = parseInt(art_download.css('font-size'));
        if (old_font_size !== 14) {
            art_download.css({
                'font-size': 14,
                'position': 'fixed',
                'left': 0,
                'top': 0
            });
            update_displayed_image_art(false, false);
        }
        html2canvas(art_download[0], {
            scrollX: 0,
            scrollY: -window.scrollY
        }).then(function (canvas) {
                theCanvas = canvas;
                canvas.toBlob(function (blob) {
                    saveAs(blob, "ASCII-art.png");
                    $('.slider-window').removeClass("overflowVisible");
                    art_download.css({
                        'font-size': old_font_size,
                        'position': 'absolute'
                    });
                    update_displayed_image_art()
                });
            }
        )
    });


    // ASCII-arts adaptations on resize
    function resize_ascii_image_art(limit_width=false) {
        const art_div = $('section.index .ascii-image-output .ascii-art');
        const font_size = parseInt(art_div.css('font-size'));
        const container_slider_width = $('section.index .ascii-image-output .container_slider').width();
        const wrapper_width = $('section.index .wrapper').width();
        if (((container_slider_width + 100 >= wrapper_width) && (font_size > 1)) || ((limit_width) && (container_slider_width > 900))) {
            change_font_size_on_art(false, '-');
            update_displayed_image_art(true, limit_width);
        }
    }

    // ^
    window.onresize = function () {
        resize_ascii_image_art();
    };

    // Variable to determine what to share
    let share_ascii_type = 'none';

    // Display share ascii window on button click (and change it's text with variable)
    $('section.index').on('click', '.button_art_share', function () {
        if ($(this).hasClass('img_share')) {
            share_ascii_type = 'img_share_type';
            $('#ascii-share-dialog p.text').text(gettext('Are you sure that you want to share your uploaded image and generated results with access by link?'));
        } else if ($(this).hasClass('txt_share')) {
            share_ascii_type = 'txt_share_type';
            $('#ascii-share-dialog p.text').text(gettext('Are you sure that you want to share your input text and generated results with access by link?'));
        }
        $('body').addClass('overflowHidden');
        animate_fade_in($('.ascii-share-dialog-dark-background'), 400);
    });

    // Close share ascii window on X button click and revert to initial state
    $('.ascii-share-dialog-dark-background img.close').on('click',function () {
        const submit_btn = $('#ascii-share-dialog input[type=button]');
        $('body').removeClass('overflowHidden');
        animate_fade_out($('.ascii-share-dialog-dark-background'), 200);
        setTimeout(function () {
            $('#ascii-share-dialog p.error').remove();
            submit_btn.removeAttr('disabled');
            animate_fade_in(submit_btn, 0);
        }, 200);
    });

    // Ajax to share ascii and redirect to new page
    $('#ascii-share-dialog input[type=button]').on('click', function () {
        const cur_elem = $(this);
        const cur_ascii_img = $('section.index .ascii-image-output .image img');
        const loading_twirl = $('#ascii-share-dialog .loading_twirl');
        const p_text = $('#ascii-share-dialog p.text');

        $('#ascii-share-dialog p.error').remove();
        cur_elem.removeAttr('style');
        cur_elem.attr('disabled', '');
        animate_fade_in(loading_twirl, 200);

        let data = null;
        if (share_ascii_type === 'img_share_type') {
            data = $('section.index .ascii-image-output .options_container form').serialize();
            data += '&file_name=' + cur_ascii_img.data('file_name');
            data += '&preferred_output_method=' + $('section.index .ascii-image-output .second_row .chosen').data('method_id');
        } else if (share_ascii_type === 'txt_share_type') {
            data = $('section.index .txt2ascii-input form.txt2ascii-form').serialize();
            data += '&preferred_output_method=' + $('section.index .ascii-text-output .second_row select option:selected').text();
        }

        $.ajax({
            url: cur_elem.data('share-url'),
            type: 'POST',
            data: data,
            error: function (response) {
                p_text.after('<p class="error">Error occurred.</p>');
                cur_elem.removeAttr('disabled');
            },
            success: function (response) {
                animate_fade_out(cur_elem, 200);
                const shared_url = response['shared_redirect_url'];
                const new_combined_share_url = location.origin + shared_url;
                const new_combined_short_share_url = location.host + shared_url;
                p_text.html('<span class="success">'+gettext("Success!")+'</span> '+gettext('Your new link:')+'<br><a class="a_underline_animation_primary" href="'+new_combined_share_url+'">'+new_combined_short_share_url+'</a>')
            },
            complete: function (response) {
                animate_fade_out(loading_twirl, 200);
            }
        });
    });

    // if we are on share img2ascii page, re-render
    if (img_share_onload_render) {
        update_displayed_image_options(onload_img_share_options);
        update_displayed_image_art();
    };

    // if we are on share txt2ascii page, re-render
    if (txt_share_onload_render) {
        update_displayed_text_art();
    };

    function remove_report_button_from_img() {
        const buttons = $('section.index .ascii-image-output .buttons.first_row');
        const report_button = buttons.find('#button_art_report');
        const share_button = buttons.find('.button_art_share');

        if (share_button.parent().hasClass('hide')) {
            report_button.parent().addClass('hide');
            share_button.parent().removeClass('hide');
        }
    };

    function remove_report_button_from_txt() {
        const buttons = $('section.index .ascii-text-output .buttons.first_row');
        const report_button = buttons.find('#button_art_report');
        const share_button = buttons.find('.button_art_share');

        if (share_button.parent().hasClass('hide')) {
            report_button.parent().addClass('hide');
            share_button.parent().removeClass('hide');
        }
    };

    // Display report ascii window on button click
    $('section.index').on('click', '#button_art_report', function () {
        $('body').addClass('overflowHidden');
        animate_fade_in($('.ascii-report-dialog-dark-background'), 400);
    });

    // Close report ascii window on X button click
    $('.ascii-report-dialog-dark-background img.close').on('click',function () {
        $('body').removeClass('overflowHidden');
        animate_fade_out($('.ascii-report-dialog-dark-background'), 200);
    });

    // Send ajax-request for report form
    $('#ascii-report-dialog').on('submit', 'form', function () {
        const cur_elem = $(this);
        cur_elem.find('p.error').remove();

        const placement = cur_elem.offset().top;
        cur_elem.find('input[type=submit]').attr('disabled', '');
        $('body').append( // animated loading circle
            '<div class="circle-loader-div" style="top: ' + placement + 'px; z-index: 100000;">\n' +
            '    <div class="circle-loader">\n' +
            '        <div class="checkmark draw"></div>\n' +
            '    </div>\n' +
            '</div>'
        );

        $.ajax({
            url: cur_elem.attr('action'),
            type: 'POST',
            data: cur_elem.serialize(),
            error: function (response) {
                const errors = response.responseJSON['errors'];
                let error_obj = errors['text'];
                if (error_obj) {
                    for (let key in Object.keys(error_obj)) {
                        cur_elem.find('#id_text').after(
                            '<p class="error">' + error_obj[key] + '</p>'
                        )
                    }
                }
                error_obj = errors['email'];
                if (error_obj) {
                    for (let key in Object.keys(error_obj)) {
                        cur_elem.find('#id_email').after(
                            '<p class="error">' + error_obj[key] + '</p>'
                        )
                    }
                }
                error_obj = errors['captcha'];
                if (error_obj) {
                    for (let key in Object.keys(error_obj)) {
                        cur_elem.find('#id_captcha').after(
                            '<p class="error">' + error_obj[key] + '</p>'
                        )
                    }
                }
                $('.circle-loader').css({'border-color': '#ff2635'});
                animate_fade_out($('.circle-loader-div'), 250, 250, true);
            },
            success: function (response) {
                cur_elem[0].reset();
                $('.circle-loader').toggleClass('load-complete');
                $('.circle-loader .checkmark').toggle();
                animate_fade_out($('.circle-loader-div'), 500, 1000, true);
                $('body').removeClass('overflowHidden');
                animate_fade_out($('.ascii-report-dialog-dark-background'), 200);
            },
            complete: function (response) {
                cur_elem.find('input[type=submit]').removeAttr('disabled');
                grecaptcha.reset();
            }
        });
        return false
    });
});
