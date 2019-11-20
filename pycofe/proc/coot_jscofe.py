# for Eugene
# run: --script ccp4_cloud.py
#

info_dialog ( "In order to save edited structure in your Project,\n" +\
              "use \"Save to CCP4 Cloud and Exit\" from Main Menu/Files\n" +\
              "before closing Coot" )

if (have_coot_python):
    if coot_python.main_menubar():
        menu = coot_menubar_menu("File")

        # add as many as you like
        remove_list = ["Save Coordinates...",
                       "Save Symmetry Coordinates...",
                       "Save State..."]
        for menu_child in menu.get_children():
            label = menu_child.get_label()
            if label in remove_list:
                menu_child.hide()
            if label == "Exit":
                menu_child.set_label("Exit without Save. Use at your own risk")

        def save_to_cloud_and_exit():
            imol = 0 # assume there is only one from cloud
            if have_unsaved_changes_p(imol):
                # save (actually all molecules saved in default place)
                map ( close_molecule, molecule_number_list()[1:] )
                quick_save()
            coot_real_exit(0)

        add_simple_coot_menu_menuitem(
            menu,
            "Save to CCP4 Cloud and Exit",
            lambda func:
            save_to_cloud_and_exit())
