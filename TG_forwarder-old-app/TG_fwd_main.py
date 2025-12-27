from logdna import LogDNAHandler
from telethon import TelegramClient, events
import gspread
import time
import logging


# Google API and spreadsheet details:
spreadsheet = gspread.service_account(filename="service_account.json")
GSHEET_URL = "https://docs.google.com/spreadsheets/d/1uTWyqzOdp3toYYn43TiVJ46SNh11mSREED2c4qWbWV0/edit#gid=0"

# TG details:
API_ID = 
API_HASH = ""
TG_NAME = ""

# LogDNA details
log = logging.getLogger("logdna")
log.setLevel(logging.INFO)
options = {'hostname': "FWD"}
options["index_meta"] = True
handler = LogDNAHandler("87181aeecc6f8d9cc47d4145fb95e75f", options)
log.addHandler(handler)


def read_sheet():
    # Gets data from sheets
    sheet = spreadsheet.open_by_url(GSHEET_URL).sheet1
    column_values_to_scan = sheet.col_values(1)
    column_values_to_scan.pop(0)
    column_values_status = sheet.col_values(4)
    column_values_status.pop(0)
    sync_line = sheet.row_values(2)
    sync_list = [sync_line[0], sync_line[1], sync_line[2]]

    chats_to_check = [int(value) for value in column_values_to_scan
                      if column_values_status[column_values_to_scan.index(value)].lower() != "off"]

    return sheet, chats_to_check, sync_list


while True:
    # Reads google sheet and get data of chats to scan and what to look for
    r_sheet = read_sheet()
    gsheet = r_sheet[0]
    chats_to_check = r_sheet[1]
    sync = r_sheet[2]

    # Start Telegram Client
    client = TelegramClient(TG_NAME, API_ID, API_HASH)
    # client.start()
    client.start()

    log.info(f"Starting bot:\nChats_to_scan: {chats_to_check}", {'app': 'START'})

    @client.on(events.NewMessage(chats=chats_to_check))
    async def handle_new_message(event):
        # Get id of chat
        try:
            id = event.message.peer_id.chat_id
        except:
            try:
                id = event.message.peer_id.channel_id
            except:
                id = event.message.peer_id.user_id

        # Message text
        msg_text = event.message.message

        # Check if /sync was send to specified chat
        if str(id) == str(sync[0]) and sync[1] in msg_text:
            # If data was on Gsheet was updated and sync send
            log.info("Refresh initiated. Restarting..", {'app': 'refresh'})
            await client.get_dialogs()
            await client.send_message(int(id), f"Refreshing bot with data from updated sheet.")
            client.disconnect()
        else:
            # Find the cell that contains the value
            cell = gsheet.find(str(id))
            # Get the row number of the cell
            row_index = cell.row
            row_values = gsheet.row_values(row_index)

            # Get all the values of what to look for in message
            check_for = row_values[1].split(", ")
            # Get all the id's where to forward to
            entities = row_values[2].split(", ")
            # Get message ID
            message_id = event.message.id

            await client.get_dialogs()
            for tag in check_for:
                if tag in msg_text:
                    for entity in entities:
                        try:
                            # Forward message
                            await client.forward_messages(entity=int(entity), messages=message_id, from_peer=id)
                            log.info(f"FWD from: {id} (msg.id:{message_id}) to {entity}", {'app': 'fwd'})
                        except:
                            try:
                                # Send's message if chat does not allow forwaring
                                await client.send_message(int(entity), f"FORWARDED:\n {msg_text}")
                                log.info(f"SEND from: {id} (msg.id:{message_id}) to {entity}", {'app': 'send'})
                            except:
                                pass

    client.run_until_disconnected()
    time.sleep(2)
