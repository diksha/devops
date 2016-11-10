#!/bin/sh
export ANSIBLE_HOST_KEY_CHECKING=False
cp playbook1.yml playbook.yml
ansible-playbook -s -i inventory playbook.yml
