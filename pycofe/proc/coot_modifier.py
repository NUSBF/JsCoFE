
#
# first version of script and idea from Bernhard Lohkamp for Eugene
# run: --script coot_jscofe.py
#
#  23.03.2020
#

#info_dialog ( "In order to save the edited structure in your Project,\n" +\
#              "use \"Save coordinates\" from Main Menu/Files\n" +\
#              "before closing Coot, without changing file name\n" +\
#              "and directory offered by default, and only then\n" +\
#              "end Coot session as usual." )

select_file_dialog = "$selfile.py"
cloud_backup_dir   = "$backup_dir"

# sys.stdout.write ( " env = " + os.environ["CCP4"] + "\n" )
# sys.stderr.write ( " env = " + os.environ["CCP4"] + "\n" )

if (have_coot_python):

    import subprocess

    set_run_state_file_status ( 2 )
    set_nomenclature_errors_on_read ( "ignore" )

    if coot_python.main_menubar():

        #menu = coot_menubar_menu ( "CCP4 Cloud" )

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
            elif len(stock_id)!=2:
                print ("BL ERROR:: need to pass a list with 2 item, stock_id and filename")
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

            sub_menuitem.connect ( "activate", activate_function )

            return

        def exit_and_signal ( signal ):
            write_cif_file ( 0,"mol0.mmcif" )
            if signal:
                f = open ( "task_chain.cmd","w" )
                f.write ( signal )
                f.close()
            coot_checked_exit(0)
            #coot_real_exit(0)
            return

        def load_backup_copy():

            ccp4_python = "ccp4-python"
            if sys.platform.startswith("win"):
                ccp4_python = "ccp4-python.bat"

            process = subprocess.Popen ([
                    ccp4_python,
                    select_file_dialog,
                    "Select Coot backup file",
                    "Coot backup files (*.cif.gz);Coot backup PDB files (*.pdb.gz)",
                    "--start-dir",cloud_backup_dir,
                    "--no-settings"
                ], stdout=subprocess.PIPE
            )
            (output, err) = process.communicate()
            exit_code = process.wait()
            if output:
                handle_read_draw_molecule ( output.strip() )
            return


        menu = coot_menubar_menu("File")

        # add as many as you like
        remove_list = [
            #"Save Coordinates...",
            #"Save Symmetry Coordinates...",
            "Save State...",
            "Exit"
        ]

        for menu_child in menu.get_children():
            if isinstance(menu_child, gtk.SeparatorMenuItem):
                pass
            else:
                label = menu_child.get_label()
                if label in remove_list:
                    menu.remove ( menu_child )

        if not select_file_dialog.startswith("$") and not cloud_backup_dir.startswith("$"):
            add_simple_coot_menu_menuitem_with_icon (
                menu,
                "Load CCP4 Cloud backup copy",
                lambda func:
                load_backup_copy(),
                gtk.STOCK_FILE
            )

        add_simple_coot_menu_menuitem_with_icon (
            menu,
            "Exit",
            lambda func:
            exit_and_signal ( "" ),
            gtk.STOCK_QUIT
        )

        add_simple_coot_menu_menuitem_with_icon (
            menu,
            "Exit and refine",
            lambda func:
            exit_and_signal ( "TaskRefmac" ),
            gtk.STOCK_QUIT
        )

        add_simple_coot_menu_menuitem_with_icon (
            menu,
            "Exit, refine and relaunch",
            lambda func:
            exit_and_signal ( "TaskRefmac,TaskCootMB" ),
            gtk.STOCK_QUIT
        )

    info_dialog ( "In order to save the edited structure in your Project,\n" +\
              "use \"Save coordinates\" from Main Menu/Files\n" +\
              "before closing Coot, without changing file name\n" +\
              "and directory offered by default, and only then\n" +\
              "end Coot session as usual." )

    #get_monomer("NUE")
