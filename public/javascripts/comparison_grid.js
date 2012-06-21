/**
 Copyright 2011 Red Hat, Inc.

 This software is licensed to you under the GNU General Public
 License as published by the Free Software Foundation; either version
 2 of the License (GPLv2) or (at your option) any later version.
 There is NO WARRANTY for this software, express or implied,
 including the implied warranties of MERCHANTABILITY,
 NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
 have received a copy of GPLv2 along with this software; if not, see
 http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
*/
var KT = (KT === undefined) ? {} : KT;


KT.comparison_grid = function(){
    var templates = KT.comparison_grid.templates,
        utils = KT.utils,
        controls, events,
        columns = {},
        rows,
        num_columns_shown = 0,
        grid_row_headers_el,
        grid_content_el,
        max_visible_columns = 5;

    var init = function(){
            events = KT.comparison_grid.events(this).init();
            controls = KT.comparison_grid.controls(this);
            rows = KT.comparison_grid.rows();
            grid_row_headers_el = $('#grid_row_headers');
            grid_content_el = $('#grid_content');
        },
        add_row = function(id, name, cell_data, parent_id){
            var cells = [], insert,
                row_level,
                cell_columns = KT.utils.keys(cell_data);
            
            insert = rows.insert(id, name, cell_data, parent_id);

            row_level = rows.get_nested_level(id);

            utils.each(columns, function(value, key){
                in_column = utils.include(cell_columns, key) ? true : false;
                
                if( in_column ){
                    cells.push({ 'in_column' : in_column, 'display' : cell_data[key]['display'], 'id' : key, 'hover' : cell_data[key]['hover'] });
                } else {
                    cells.push({ 'in_column' : in_column, 'id' : key });
                }
            });

            add_row_header(id, name, parent_id, row_level);

            if( parent_id ){
                grid_content_el.find('#grid_row_' + parent_id).after(templates.row(id, utils.size(columns), cells, row_level));
            } else {
                grid_content_el.append(templates.row(id, utils.size(columns), cells, row_level));
            }

            if( insert['first_child'] ){
                add_row_collapse(parent_id);
            }
        },
        add_row_header = function(id, name, parent_id, row_level) {
            if( parent_id ){
                grid_row_headers_el.find('#row_header_' + parent_id).after(templates.row_header(id, name, row_level));
            } else {
                grid_row_headers_el.append(templates.row_header(id, name, row_level));
            }
        },
        add_row_collapse = function(id){
            grid_row_headers_el.find('#row_header_' + id).prepend(templates.collapse_arrow);
        },
        collapse_rows = function(id, collapse){
            var parent_row_header = $('#row_header_' + id);
        
            utils.each(rows.get_children(id), function(child){
                if( collapse ){
                    $('#grid_row_' + child).hide();
                    $('#row_header_' + child).hide();
                } else {
                    $('#grid_row_' + child).show();
                    $('#row_header_' + child).show();
                }
            });

            if( collapse ){
                parent_row_header.find('.down_arrow-icon-black').hide()
                parent_row_header.find('.right_arrow-icon-black').show();
            } else {
                parent_row_header.find('.down_arrow-icon-black').show()
                parent_row_header.find('.right_arrow-icon-black').hide();
            }
        },
        add_rows = function(data, append) {
            append = (append === undefined) ? true : append;

            if( !append ){
                grid_content_el.html("");
                grid_row_headers_el.html("");
            }

            utils.each(data, function(item) {
                add_row(item['id'], item['name'], item['cols'], item['parent_id']);
            });

            utils.each(columns, function(value, key){
                if( columns[key]['shown'] ){
                    $('.cell_' + key).show();
                } else {
                    $('.cell_' + key).hide();
                }
            });
            
            $('.grid_row').css('width', utils.size(columns) * 100);
        },
        add_column = function(id, to_display, previous_column_id, data) {
            add_column_header(id, to_display);
            columns[id] = { 'id' : id, 'to_display' : to_display, 'data' : data };
        },
        add_column_header = function(id, to_display) {
            var column_headers = $('#column_headers');

            column_headers.append(templates.column_header(id, to_display));
        },
        add_columns = function(data){
            utils.each(data, function(col) {
                add_column(col['id'], col['name']);
            });
        },
        show_columns = function(data){
            num_columns_shown = 0;

            utils.each(columns, function(value, key){
                if( data[key] ){
                    $('#column_headers').width($('#column_headers').width() + 100);
                    $('#column_' + key).show();
                    columns[key]['shown'] = true;
                    num_columns_shown += 1;
                    $('.cell_' + key).show();
                } else {
                    columns[key]['shown'] = false;
                    $('#column_' + key).hide();
                    $('.cell_' + key).hide();
                }
            });

            if( num_columns_shown > max_visible_columns ){
                controls.horizontal_scroll.show();            
                $('#column_headers_window').width(100 * max_visible_columns);
            } else {
                controls.horizontal_scroll.hide();
                $('#column_headers_window').width(num_columns_shown * 100);
            }
        },
        set_loading = function(){
            grid_content_el.find('#loading_screen').show();
        };

    return {
        init                    : init,
        add_rows                : add_rows,
        add_columns             : add_columns,
        show_columns            : show_columns,
        collapse_rows           : collapse_rows,
        set_loading             : set_loading,
        get_num_columns_shown   : function(){ return num_columns_shown; },
        get_max_visible_columns : function(){ return max_visible_columns; }
    }
};

KT.comparison_grid.rows = function(){
    var rows = {},
        
        clear = function() {
            rows = {};
        },
        get = function(id) {
            return rows[id];
        },
        get_parent = function(id){
            return rows[rows[id]['parent_id']];
        },
        get_children = function(id){
            return rows[id]['child_ids'];
        },
        get_nested_level = function(id) {
            var level = 1,
                parent = get_parent(id);

            if( parent !== undefined ){
                level += get_nested_level(parent['id']);
            }

            return level;
        },
        insert = function(id, name, cells, parent_id){
            var parent;

            if( parent_id ){
                rows[id] = { 'id' : id, 'name' : name, 'cells' : cells, 'parent_id' : parent_id };

                parent = get_parent(id);
                if( parent['child_id'] === undefined ){
                    parent['child_ids'] = [id];
                    return { 'first_child' : true };
                } else {
                    parent['child_ids'].push(id);
                    return { 'first_child' : false };
                }
            } else {
                rows[id] = { 'id' : id, 'name' : name, 'cells' : cells};
            }

            return {};
        };

    return {
        get             : get,
        clear           : clear,
        insert          : insert,
        get_parent      : get_parent,
        get_children    : get_children,
        get_nested_level: get_nested_level
    };
        
};

KT.comparison_grid.controls = function(grid) {
    var horizontal_scroll = (function() {
            var right_arrow = $('#right_slide_arrow'),
                right_arrow_trigger = right_arrow.find('.slide_trigger'),
                left_arrow  = $('#left_slide_arrow'),
                left_arrow_trigger = left_arrow.find('.slide_trigger'),

                show = function() {
                    right_arrow.show();
                    left_arrow.show();
                },
                hide = function() {
                    right_arrow.hide();
                    left_arrow.hide();
                },
                set_arrow_states = function() {
                    var current_position = $('#column_headers').position().left,
                        stop_position = -((grid.get_num_columns_shown() - grid.get_max_visible_columns()) * 100);
                    
                    if( current_position === 0 ){
                        right_arrow.find('span').addClass('disabled');
                        left_arrow.find('span').removeClass('disabled');
                    } else if( stop_position === current_position ) {
                        left_arrow.find('span').addClass('disabled');
                        right_arrow.find('span').removeClass('disabled');
                    } else {
                        right_arrow.find('span').removeClass('disabled');
                        left_arrow.find('span').removeClass('disabled');
                    }
                },
                slide_left = function() {
                    var position = '-=100',
                        current_position = $('#column_headers').position().left,
                        stop_position = -((grid.get_num_columns_shown() - grid.get_max_visible_columns()) * 100);
                    
                    if( stop_position < current_position && current_position <= 0 ){
                        left_arrow.find('span').addClass('disabled');
                        $('#grid_content').animate({ 'left' : position }, 'slow');
                        $('#column_headers').animate({ 'left' : position }, 'slow',
                            function() {
                                left_arrow.find('span').removeClass('disabled');
                                set_arrow_states();
                            }
                        );
                    }
                },
                slide_right = function() {
                    var position = '+=100',
                        current_position = $('#column_headers').position().left,
                        stop_position = -((grid.get_num_columns_shown() - grid.get_max_visible_columns()) * 100);

                    if( stop_position <= current_position && current_position < 0 ){
                        right_arrow.find('span').addClass('disabled');
                        $('#grid_content').animate({ 'left' : position }, 'slow');
                        $('#column_headers').animate({ 'left' : position }, 'slow',
                            function() {
                                right_arrow.find('span').removeClass('disabled');
                                set_arrow_states();
                            }
                        );
                    }
                };
            
            left_arrow_trigger.click(
                function(){ 
                    if( !left_arrow.find('span').hasClass('disabled') ){
                        slide_left();
                    }
                }
            ).hover(
                function(){
                    if( !left_arrow.find('span').hasClass('disabled') ){
                        left_arrow.addClass('slide_arrow_hover');
                    }
                },
                function(){ 
                    left_arrow.removeClass('slide_arrow_hover');
                }
            );

            right_arrow_trigger.click(
                function(){
                    if( !right_arrow.find('span').hasClass('disabled') ){
                        slide_right();
                    }
                }
            ).hover(
                function(){
                    if( !right_arrow.find('span').hasClass('disabled') ){
                        right_arrow.addClass('slide_arrow_hover');
                    }
                },
                function(){ 
                    right_arrow.removeClass('slide_arrow_hover');
                }
            );

            return {
                show : show,
                hide : hide
            }
        }());

    return {
        horizontal_scroll : horizontal_scroll
    }
};

KT.comparison_grid.events = function(grid) {
    var init = function() {
            $(document).bind('draw.comparison_grid', function(event, data){
                grid.add_rows(data, false);
                grid.set_loading(false);
            });

            $(document).bind('loading.comparison_grid', function(event, data){
                grid.set_loading(true);
            });

            cell_hover();
            collapseable_rows();
        },
        cell_hover = function() {
            $('.grid_cell').live('hover', function(event){
                if( $(this).data('hover') ){
                    if( event.type === 'mouseenter' ){
                        $(this).find('.grid_cell_hover').show();
                    } 

                    if( event.type === 'mouseleave' ){
                        $(this).find('.grid_cell_hover').hide();
                    }
                }
            });
        },
        collapseable_rows = function() {
            $('.row_header').live('click', function(){
                if( $(this).data('collapsed') ){
                    grid.collapse_rows($(this).data('id'), false);
                    $(this).data('collapsed', false);
                } else {
                    grid.collapse_rows($(this).data('id'), true);
                    $(this).data('collapsed', true);
                }
            });
        };

    return {
        init : init
    };
};

KT.comparison_grid.templates = (function() {
    var cell = function(data) {
            var display,                
                hover = data['hover'] ? data['hover'] : "",
                html = "";

            if( data['in_column'] ){
                if( data['display'] !== undefined ){
                    display = data['display'];
                } else {
                    display = '<span class="dot-icon-black"></span>';
                }
            } else {
                 display = "<span>--</span>";
            }

            if( hover !== "" ){
                html += '<div class="grid_cell cell_' + data['id'] + '" data-hover=true>';
            } else {
                html += '<div class="grid_cell cell_' + data['id'] + '">';
            }

            html += display; 
            html += '<span class="hidden grid_cell_hover">' + hover + '</span>';
            html += '</div>';

            return html;
        },
        row = function(id, num_columns, cell_data, row_level) {
            var i,
                html ='<div id="grid_row_' + id  + '" class="grid_row grid_row_level_' + row_level + '">';

            for(i = 0; i < num_columns; i += 1){
                html += cell(cell_data[i]);
            }
            html += '</div>';            

            return html;
        },
        row_header = function(id, name, row_level) {
            var html = '<li data-id="' + id + '" id="row_header_' + id + '" class="row_header grid_row_level_' + row_level + '">';
            html += '<span>' + name + '</span>';
            html += '</li>';
            return html;
        },
        column = function() {
        },
        column_header = function(id, to_display) {
            var html = '<li data-id="' + id  + '" id="column_' + id + '" class="one-line-ellipsis column_header hidden">';
            html += to_display;
            html += '</li>';
            return html;
        },
        collapse_arrow = function(){
            return '<span class="down_arrow-icon-black"></span><span class="right_arrow-icon-black" style="display:none;"></span>';
        };

    return {
        cell            : cell,
        row             : row,
        column_header   : column_header,
        row_header      : row_header,
        collapse_arrow  : collapse_arrow
    }
}());
