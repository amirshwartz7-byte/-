"""A simple command-line inbox assistant.

Loads emails from emails.json and lets you browse them with a small
read -> decide -> act command loop. No external libraries needed.
"""

import json
import os

# emails.json lives next to this script, so build the path from here.
EMAILS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "emails.json")

# Words that usually signal an email needs quick action.
URGENT_WORDS = ["urgent", "asap", "deadline", "today"]


def load_emails(path):
    # Read the list of emails from the JSON file.
    with open(path, "r") as f:
        return json.load(f)


def is_urgent(email):
    # An email counts as urgent if any urgent word appears in its
    # subject or body (case-insensitive).
    text = (email["subject"] + " " + email["body"]).lower()
    return any(word in text for word in URGENT_WORDS)


def find_action_items(email):
    # Very simple heuristic: split the body into sentences, and treat any
    # sentence with an urgent word or a request-like phrase as an action item.
    request_words = URGENT_WORDS + ["please", "need", "can you", "reply"]
    sentences = email["body"].replace("!", ".").split(".")

    items = []
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        lower = sentence.lower()
        if "no action" in lower:
            continue
        if any(word in lower for word in request_words):
            items.append(sentence)
    return items


def one_line_summary(index, email):
    flag = " [URGENT]" if is_urgent(email) else ""
    return f"[{index}] {email['subject']} - {email['from']} ({email['date']}){flag}"


def cmd_digest(emails):
    print("\n--- Digest ---")
    for i, email in enumerate(emails, start=1):
        print(one_line_summary(i, email))


def cmd_urgent(emails):
    print("\n--- Urgent emails ---")
    found = False
    for i, email in enumerate(emails, start=1):
        if is_urgent(email):
            print(one_line_summary(i, email))
            found = True
    if not found:
        print("No urgent emails right now.")


def cmd_from(emails, name):
    print(f"\n--- Emails from '{name}' ---")
    name_lower = name.lower()
    found = False
    for i, email in enumerate(emails, start=1):
        if name_lower in email["from"].lower():
            print(one_line_summary(i, email))
            found = True
    if not found:
        print("No emails found from that sender.")


def cmd_read(emails, number_text):
    # number_text comes in as a string from the command, e.g. "3".
    if not number_text.isdigit():
        print("Please give a valid email number, e.g. 'read 2'.")
        return

    index = int(number_text)
    if index < 1 or index > len(emails):
        print(f"There is no email #{index}. Use 'digest' to see valid numbers.")
        return

    email = emails[index - 1]
    print(f"\n--- Email #{index} ---")
    print(f"From: {email['from']}")
    print(f"Subject: {email['subject']}")
    print(f"Date: {email['date']}")
    print(f"Urgent: {'yes' if is_urgent(email) else 'no'}")
    print(f"\nBody:\n{email['body']}")

    items = find_action_items(email)
    print("\nAction items:")
    if items:
        for item in items:
            print(f"- {item}")
    else:
        print("- None found.")


def cmd_help():
    print("""
Commands:
  digest       Show a one-line summary of every email (urgent ones flagged)
  urgent       Show only the emails that need action
  from <name>  Show emails from a sender that matches <name>
  read <n>     Show email number <n> in full, with its action items
  help         Show this help message
  quit         Exit the assistant
""")


def main():
    emails = load_emails(EMAILS_FILE)
    print("Welcome to your inbox assistant. Type 'help' to see the commands.")

    while True:
        # 1. READ the user's command.
        raw = input("\n> ").strip()
        if not raw:
            continue

        # 2. DECIDE what it means: first word is the command, the rest is the argument.
        parts = raw.split(maxsplit=1)
        command = parts[0].lower()
        argument = parts[1] if len(parts) > 1 else ""

        # 3. ACT on the command.
        if command == "digest":
            cmd_digest(emails)
        elif command == "urgent":
            cmd_urgent(emails)
        elif command == "from":
            if argument:
                cmd_from(emails, argument)
            else:
                print("Usage: from <name>")
        elif command == "read":
            if argument:
                cmd_read(emails, argument)
            else:
                print("Usage: read <n>")
        elif command == "help":
            cmd_help()
        elif command in ("quit", "exit"):
            print("Goodbye!")
            break
        else:
            print(f"Unknown command: '{command}'. Type 'help' for the list of commands.")


if __name__ == "__main__":
    main()
