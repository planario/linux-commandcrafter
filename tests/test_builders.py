"""Smoke + parity tests for every builder."""
from __future__ import annotations

import json

from commandcrafter.builders import REGISTRY, get
from commandcrafter.builders.generic import build_for as generic_build


def test_registry_has_all_expected_builders():
    expected = {
        "ansible-playbook", "bash", "chmod", "crontab", "ffmpeg", "find",
        "git", "grep", "ip", "lxc", "rsync", "scp", "sed", "ssh", "ufw",
        # generic
        "mv", "cp", "tar", "gzip",
    }
    assert expected.issubset(set(REGISTRY))


# --- specialised builders ---------------------------------------------------

def test_grep_basic():
    spec = get("grep")
    out = spec.build({"pattern": "error", "path": "/var/log/syslog"})
    assert out == "grep 'error' '/var/log/syslog'"


def test_grep_flags():
    spec = get("grep")
    out = spec.build({
        "pattern": "ERR", "path": "./",
        "recursive": "on", "ignore_case": "on", "line_numbers": "on",
    })
    assert out == "grep -rin 'ERR' './'"


def test_find_default_path():
    spec = get("find")
    out = spec.build({"path": "", "name_pattern": "", "type": "any"})
    assert out == "find '.'"


def test_find_with_name_and_iname():
    spec = get("find")
    out = spec.build({"path": "/tmp", "name_pattern": "*.log",
                      "type": "f", "case_insensitive": "on"})
    assert out == "find '/tmp' -type f -iname '*.log'"


def test_chmod_octal_and_recursive():
    spec = get("chmod")
    out = spec.build({"mode": "octal", "octal": "755", "path": "script.sh", "recursive": "on"})
    assert out == "chmod -R 755 script.sh"


def test_chmod_symbolic():
    spec = get("chmod")
    out = spec.build({"mode": "symbolic", "who_user": "on", "perm_read": "on",
                      "perm_execute": "on", "action": "+", "path": "f"})
    assert out == "chmod u+rx f"


def test_cron_default():
    spec = get("crontab")
    out = spec.build({"command": "/x"})
    assert out == "* * * * * /x"


def test_cron_specific():
    spec = get("crontab")
    out = spec.build({"minute": "0", "hour": "9", "dom": "*", "month": "*", "dow": "1-5",
                      "command": "/usr/bin/run.sh"})
    assert out == "0 9 * * 1-5 /usr/bin/run.sh"


def test_sed_basic():
    spec = get("sed")
    out = spec.build({"search": "foo", "replace": "bar", "file": "f.txt",
                      "is_global": "on"})
    assert out == "sed 's/foo/bar/g' 'f.txt'"


def test_sed_in_place_with_path_chars():
    spec = get("sed")
    out = spec.build({"search": "/old/path", "replace": "/new/path",
                      "file": "/etc/hosts", "in_place": "on", "is_global": "on"})
    assert "sed -i 's/\\/old\\/path/\\/new\\/path/g' '/etc/hosts'" == out


def test_git_clone_with_token():
    spec = get("git")
    out = spec.build({"subcommand": "clone",
                      "clone_repo": "https://github.com/u/r.git",
                      "api_key": "ghp_secret", "clone_dir": ""})
    assert "ghp_secret@github.com" in out


def test_git_commit():
    spec = get("git")
    out = spec.build({"subcommand": "commit", "commit_msg": "fix bug"})
    assert out == "git commit -m 'fix bug'"


def test_git_push_force():
    spec = get("git")
    out = spec.build({"subcommand": "push", "push_remote": "origin",
                      "push_branch": "main", "push_force": "on"})
    assert out == "git push --force origin main"


def test_rsync_basic():
    spec = get("rsync")
    out = spec.build({"source": "/a/", "destination": "u@h:/b/",
                      "archive": "on", "verbose": "on", "compress": "on"})
    assert out == "rsync -avz '/a/' 'u@h:/b/'"


def test_rsync_with_ssh_options():
    spec = get("rsync")
    out = spec.build({"source": "/a", "destination": "/b",
                      "archive": "on", "ssh_port": "2222", "identity": "/k"})
    assert "-e 'ssh -p 2222 -i '\\''/k'\\'''" in out


def test_scp_with_token():
    spec = get("scp")
    out = spec.build({"source": "f", "destination": "u@h:/d",
                      "compress": "on", "auth_token": "tok"})
    assert out.startswith("AUTH_TOKEN='tok' scp -C")


def test_ssh_keygen():
    from commandcrafter.builders.ssh import build_keygen
    out = build_keygen({"key_filename": "id_test", "key_comment": "me@x"})
    assert out == "ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_test -C 'me@x'"


def test_ufw_quick():
    spec = get("ufw")
    assert spec.build({"quick": "ufw enable"}) == "ufw enable"


def test_ufw_rule():
    spec = get("ufw")
    out = spec.build({"action": "allow", "direction": "in", "protocol": "tcp", "port": "22"})
    assert out == "ufw allow in port 22 proto tcp"


def test_lxc_basic():
    spec = get("lxc")
    out = spec.build({"image": "ubuntu:22.04", "container_name": "c1"})
    assert out == "lxc launch ubuntu:22.04 c1"


def test_lxc_with_limits():
    spec = get("lxc")
    out = spec.build({"image": "ubuntu:22.04", "container_name": "c1",
                      "cores": "2", "ram": "1024", "storage": "10"})
    assert out == "lxc launch ubuntu:22.04 c1 -c limits.cpu=2 -c limits.memory=1024MB --device root,size=10GB"


def test_ip_addr_show():
    spec = get("ip")
    out = spec.build({"mode": "addr", "subcommand": "show", "device": "eth0"})
    assert out == "ip addr show dev eth0"


def test_ip_route_add():
    spec = get("ip")
    out = spec.build({"mode": "route", "subcommand": "add",
                      "route_dest": "default", "gateway": "10.0.0.1", "device": "eth0"})
    assert out == "ip route add default via 10.0.0.1 dev eth0"


def test_ffmpeg_convert_default():
    spec = get("ffmpeg")
    out = spec.build({"mode": "convert", "input_file": "i.mp4", "output_file": "o.mkv",
                      "video_codec": "copy", "audio_codec": "copy", "hwaccel": "none"})
    assert out == "ffmpeg -i i.mp4 -c:v copy -c:a copy o.mkv"


def test_ffmpeg_gif():
    spec = get("ffmpeg")
    out = spec.build({"mode": "createGif", "input_file": "i.mp4", "output_file": "o.gif",
                      "start_time": "00:00:05", "duration": "3", "fps": "12", "width": "320"})
    assert "-ss 00:00:05" in out
    assert "fps=12,scale=320:-1" in out
    assert out.endswith("o.gif")


def test_ansible_simple():
    spec = get("ansible-playbook")
    tasks = json.dumps([
        {"name": "install nginx", "module": "package",
         "args": {"name": "nginx", "state": "present"}},
    ])
    out = spec.build({
        "playbook_name": "Test", "hosts": "all", "become": "on", "tasks": tasks,
    })
    assert "- name: Test" in out
    assert "ansible.builtin.package" in out
    assert "name: nginx" in out
    assert 'state: present' in out


def test_ansible_quoting_octal():
    from commandcrafter.builders.ansible import yaml_quote
    assert yaml_quote("0644") == '"0644"'
    assert yaml_quote("yes") == '"yes"'
    assert yaml_quote("plain") == "plain"
    assert yaml_quote("") == '""'


def test_bash_minimum_shebang():
    spec = get("bash")
    out = spec.build({"blocks": ""})
    assert out.startswith("#!/bin/bash")


def test_bash_simple_script():
    spec = get("bash")
    blocks = json.dumps([
        {"id": "1", "type": "shebang", "data": {"interpreter": "/bin/bash"}},
        {"id": "2", "type": "echo", "data": {"text": '"hi"'}},
    ])
    out = spec.build({"blocks": blocks})
    assert out.startswith("#!/bin/bash")
    assert "echo \"hi\"" in out


# --- generic builders -------------------------------------------------------

def test_generic_mv():
    out = generic_build("mv", {
        "opt:interactive": "on",
        "arg:Source": "a.txt", "arg:Destination": "b.txt",
    })
    assert out == "mv -i 'a.txt' 'b.txt'"


def test_generic_cp_archive():
    # Option order follows the COMMANDS definition (verbose appears before archive there).
    out = generic_build("cp", {
        "opt:archive": "on", "opt:verbose": "on",
        "arg:Source": "/etc", "arg:Destination": "/backup/",
    })
    assert out == "cp -v -a '/etc' '/backup/'"


def test_generic_tar_create():
    out = generic_build("tar", {
        "opt:create": "on", "opt:gzip": "on", "opt:file": "on", "opt:verbose": "on",
        "arg:Archive Name": "a.tgz", "arg:Files / Directories": "src/",
    })
    parts = out.split()
    assert parts[0] == "tar"
    # Order isn't guaranteed for flags; check membership
    assert {"-c", "-z", "-f", "-v"}.issubset(set(parts[:5]))


def test_generic_gzip_value_option():
    out = generic_build("gzip", {
        "opt:keep": "on", "arg:File": "/tmp/x.log",
    })
    assert out == "gzip -k '/tmp/x.log'"


def test_every_registered_builder_returns_a_string():
    for spec in REGISTRY.values():
        result = spec.build({})
        assert isinstance(result, str)
