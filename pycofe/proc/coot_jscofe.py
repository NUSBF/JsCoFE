#
# from Bernhard Lohkamp for Eugene
# run: --script coot_jscofe.py
#
#  04.02.2020
#

info_dialog ( "In order to save the edited structure in your Project,\n" +\
              "use \"Save coordinates\" from Main Menu/Files\n" +\
              "before closing Coot, without changing file name\n" +\
              "and directory offered by default, and only then\n" +\
              "end Coot session as usual." )


# info_dialog ( "In order to save edited structure in your Project,\n" +\
#               "use \"Save to CCP4 Cloud and Exit\" from Main Menu/Files\n" +\
#               "before closing Coot" )


if (have_coot_python):

    if coot_python.main_menubar():

        #import time

        def add_simple_coot_menu_menuitem_with_icon ( menu,
                                                      menu_item_label,
                                                      activate_function,
                                                      stock_id ):

            # either pass a stock_id, e.g. gtk.STOCK_QUIT or
            # a list with [some name (stock_id), filname]
            submenu = gtk.Menu()
            sub_menuitem = gtk.ImageMenuItem()
            sub_menuitem.set_label(menu_item_label)
            img = gtk.Image()
            if not isinstance(stock_id, list):
                img.set_from_stock(stock_id, gtk.ICON_SIZE_MENU)
            else:
                if not (len(stock_id) == 2):
                    print("BL ERROR:: need to pass a list with 2 item, stock_is and filename")
                else:
                    stock_id_mod, filename = stock_id
                    if os.path.isfile(filename):
                        iconfactory = gtk.IconFactory()
                        pixbuf = gtk.gdk.pixbuf_new_from_file(filename)
                        iconset = gtk.IconSet(pixbuf)
                        iconfactory.add(stock_id_mod, iconset)
                        img.set_from_stock(stock_id_mod, gtk.ICON_SIZE_MENU)
                        iconfactory.add_default()
                    else:
                        print("BL ERROR:: no filename or stock_id, so no menu icon")

            sub_menuitem.set_image(img)

            menu.append(sub_menuitem)
            sub_menuitem.show()

            sub_menuitem.connect("activate", activate_function)

        def gui_message(text, message_type):
            # """Gtk dialog for error message display"""
            message = gtk.MessageDialog(type=message_type, buttons=gtk.BUTTONS_OK)
            message.set_markup(text)
            message.run()
            message.destroy()
            while gtk.events_pending():
                gtk.main_iteration()


        def save_to_cloud_and_exit():
            imol = 0 # assume there is only one from cloud
            if have_unsaved_changes_p(imol):
                # save (actually all molecules saved in default place)
                quick_save()
            else:
                gui_message ( "Structure was not modified -- nothing will be saved",
                              gtk.MESSAGE_INFO )
                #info_dialog ( "Structure was not modified -- nothing to save" )
                #while gtk.events_pending():
                #    gtk.main_iteration()
                #time.sleep(5)
            #quick_save()
            coot_real_exit(0)

        """
        menu = coot_menubar_menu("File")

        # add as many as you like
        remove_list = [
            "Save Coordinates...",
            "Save Symmetry Coordinates...",
            "Save State...",
            "Exit"
        ]

        for menu_child in menu.get_children():
            if isinstance(menu_child, gtk.SeparatorMenuItem):
                pass
            else:
                label = menu_child.get_label()
                if label in remove_list:
                    menu.remove(menu_child)

            #print "\n------------------------------------------------------\n"
            #print str(dir(menu_child))
            #if label == "Exit":
            #    menu_child.set_label("Exit without Save. Use at your own risk")
            #if label == "Exit":
            #    menu_child.do_set_related_action ( lambda func: save_to_cloud_and_exit() )
            #['__class__', '__copy__', '__deepcopy__', '__delattr__', '__dict__', '__doc__', '__eq__', '__format__', '__gdoc__', '__ge__', '__getattribute__', '__gobject_init__', '__grefcount__', '__gt__', '__gtype__', '__hash__', '__init__', '__iter__', '__le__', '__len__', '__lt__', '__module__', '__ne__', '__new__', '__nonzero__', '__reduce__', '__reduce_ex__', '__repr__', '__setattr__', '__sizeof__', '__str__', '__subclasshook__', 'activate', 'add', 'add_accelerator', 'add_child', 'add_events', 'add_mnemonic_label', 'add_with_properties', 'allocation', 'border_width', 'can_activate_accel', 'chain', 'check_resize', 'child', 'child_focus', 'child_get', 'child_get_property', 'child_notify', 'child_set', 'child_set_property', 'child_type', 'children', 'class_path', 'connect', 'connect_after', 'connect_object', 'connect_object_after', 'construct_child', 'create_pango_context', 'create_pango_layout', 'deselect', 'destroy', 'disconnect', 'disconnect_by_func', 'do_activate', 'do_activate_item', 'do_add', 'do_add_child', 'do_button_press_event', 'do_button_release_event', 'do_can_activate_accel', 'do_check_resize', 'do_child_type', 'do_client_event', 'do_composite_name', 'do_composited_changed', 'do_configure_event', 'do_construct_child', 'do_delete_event', 'do_deselect', 'do_destroy', 'do_destroy_event', 'do_direction_changed', 'do_drag_begin', 'do_drag_data_delete', 'do_drag_data_get', 'do_drag_data_received', 'do_drag_drop', 'do_drag_end', 'do_drag_leave', 'do_drag_motion', 'do_enter_notify_event', 'do_event', 'do_expose_event', 'do_focus', 'do_focus_in_event', 'do_focus_out_event', 'do_forall', 'do_get_accessible', 'do_get_child_property', 'do_get_internal_child', 'do_grab_broken_event', 'do_grab_focus', 'do_grab_notify', 'do_hide', 'do_hide_all', 'do_hierarchy_changed', 'do_key_press_event', 'do_key_release_event', 'do_leave_notify_event', 'do_map', 'do_map_event', 'do_mnemonic_activate', 'do_motion_notify_event', 'do_no_expose_event', 'do_parent_set', 'do_parser_finished', 'do_popup_menu', 'do_property_notify_event', 'do_proximity_in_event', 'do_proximity_out_event', 'do_realize', 'do_remove', 'do_screen_changed', 'do_scroll_event', 'do_select', 'do_selection_clear_event', 'do_selection_get', 'do_selection_notify_event', 'do_selection_received', 'do_selection_request_event', 'do_set_child_property', 'do_set_focus_child', 'do_set_name', 'do_set_related_action', 'do_show', 'do_show_all', 'do_show_help', 'do_size_allocate', 'do_size_request', 'do_state_changed', 'do_style_set', 'do_sync_action_properties', 'do_toggle', 'do_toggle_size_allocate', 'do_unmap', 'do_unmap_event', 'do_unrealize', 'do_update', 'do_visibility_notify_event', 'do_window_state_event', 'drag_begin', 'drag_check_threshold', 'drag_dest_add_image_targets', 'drag_dest_add_text_targets', 'drag_dest_add_uri_targets', 'drag_dest_find_target', 'drag_dest_get_target_list', 'drag_dest_get_track_motion', 'drag_dest_set', 'drag_dest_set_proxy', 'drag_dest_set_target_list', 'drag_dest_set_track_motion', 'drag_dest_unset', 'drag_get_data', 'drag_highlight', 'drag_source_add_image_targets', 'drag_source_add_text_targets', 'drag_source_add_uri_targets', 'drag_source_get_target_list', 'drag_source_set', 'drag_source_set_icon', 'drag_source_set_icon_name', 'drag_source_set_icon_pixbuf', 'drag_source_set_icon_stock', 'drag_source_set_target_list', 'drag_source_unset', 'drag_unhighlight', 'draw', 'emit', 'emit_stop_by_name', 'ensure_style', 'error_bell', 'event', 'flags', 'focus_child', 'forall', 'foreach', 'freeze_child_notify', 'freeze_notify', 'get_accel_path', 'get_accessible', 'get_action', 'get_activate_signal', 'get_allocation', 'get_always_show_image', 'get_ancestor', 'get_app_paintable', 'get_border_width', 'get_can_default', 'get_can_focus', 'get_child', 'get_child_requisition', 'get_child_visible', 'get_children', 'get_clipboard', 'get_colormap', 'get_composite_name', 'get_data', 'get_direction', 'get_display', 'get_double_buffered', 'get_events', 'get_extension_events', 'get_focus_chain', 'get_focus_child', 'get_focus_hadjustment', 'get_focus_vadjustment', 'get_has_tooltip', 'get_has_window', 'get_image', 'get_internal_child', 'get_label', 'get_mapped', 'get_modifier_style', 'get_name', 'get_no_show_all', 'get_pango_context', 'get_parent', 'get_parent_window', 'get_pointer', 'get_properties', 'get_property', 'get_realized', 'get_receives_default', 'get_related_action', 'get_requisition', 'get_resize_mode', 'get_right_justified', 'get_root_window', 'get_screen', 'get_sensitive', 'get_settings', 'get_size_request', 'get_snapshot', 'get_state', 'get_style', 'get_submenu', 'get_tooltip_markup', 'get_tooltip_text', 'get_tooltip_window', 'get_toplevel', 'get_use_action_appearance', 'get_use_stock', 'get_use_underline', 'get_visible', 'get_visual', 'get_window', 'grab_add', 'grab_default', 'grab_focus', 'grab_remove', 'handler_block', 'handler_block_by_func', 'handler_disconnect', 'handler_is_connected', 'handler_unblock', 'handler_unblock_by_func', 'has_default', 'has_focus', 'has_focus_chain', 'has_grab', 'has_rc_style', 'has_screen', 'hide', 'hide_all', 'hide_on_delete', 'input_shape_combine_mask', 'install_child_property', 'intersect', 'is_ancestor', 'is_composited', 'is_drawable', 'is_focus', 'is_sensitive', 'is_toplevel', 'keynav_failed', 'list_accel_closures', 'list_child_properties', 'list_mnemonic_labels', 'map', 'menu_get_for_attach_widget', 'mnemonic_activate', 'modify_base', 'modify_bg', 'modify_cursor', 'modify_fg', 'modify_font', 'modify_style', 'modify_text', 'name', 'need_resize', 'notify', 'parent', 'parser_finished', 'path', 'propagate_expose', 'props', 'queue_clear', 'queue_clear_area', 'queue_draw', 'queue_draw_area', 'queue_resize', 'queue_resize_no_redraw', 'rc_get_style', 'realize', 'reallocate_redraws', 'ref_accessible', 'region_intersect', 'remove', 'remove_accelerator', 'remove_data', 'remove_mnemonic_label', 'remove_no_notify', 'remove_submenu', 'render_icon', 'reparent', 'requisition', 'reset_rc_styles', 'reset_shapes', 'resize_children', 'resize_mode', 'right_justify', 'saved_state', 'select', 'selection_add_target', 'selection_add_targets', 'selection_clear_targets', 'selection_convert', 'selection_owner_set', 'selection_remove_all', 'send_expose', 'send_focus_change', 'set_accel_group', 'set_accel_path', 'set_activate_signal', 'set_allocation', 'set_always_show_image', 'set_app_paintable', 'set_border_width', 'set_can_default', 'set_can_focus', 'set_child_visible', 'set_colormap', 'set_composite_name', 'set_data', 'set_direction', 'set_double_buffered', 'set_events', 'set_extension_events', 'set_flags', 'set_focus_chain', 'set_focus_child', 'set_focus_hadjustment', 'set_focus_vadjustment', 'set_has_tooltip', 'set_has_window', 'set_image', 'set_label', 'set_mapped', 'set_name', 'set_no_show_all', 'set_parent', 'set_parent_window', 'set_properties', 'set_property', 'set_realized', 'set_reallocate_redraws', 'set_receives_default', 'set_redraw_on_allocate', 'set_related_action', 'set_resize_mode', 'set_right_justified', 'set_scroll_adjustments', 'set_sensitive', 'set_set_scroll_adjustments_signal', 'set_size_request', 'set_state', 'set_style', 'set_submenu', 'set_tooltip_markup', 'set_tooltip_text', 'set_tooltip_window', 'set_uposition', 'set_use_action_appearance', 'set_use_stock', 'set_use_underline', 'set_usize', 'set_visible', 'set_window', 'shape_combine_mask', 'show', 'show_all', 'show_now', 'size_allocate', 'size_request', 'state', 'stop_emission', 'style', 'style_attach', 'style_get_property', 'sync_action_properties', 'thaw_child_notify', 'thaw_notify', 'toggle', 'toggle_size_allocate', 'toggle_size_request', 'translate_coordinates', 'trigger_tooltip_query', 'unmap', 'unparent', 'unrealize', 'unset_flags', 'unset_focus_chain', 'weak_ref', 'window']

        #add_simple_coot_menu_menuitem (
        #    menu,
        #    "Save to CCP4 cloud and Exit",
        #    lambda func:
        #    save_to_cloud_and_exit()
        #)

        add_simple_coot_menu_menuitem_with_icon (
            menu,
            "Save to CCP4 cloud and Exit",
            lambda func:
            save_to_cloud_and_exit(),
            gtk.STOCK_QUIT
        )
        #            ["test-id", "tpp.png"])
        #            gtk.STOCK_QUIT)
        """
