confirm:
	@echo -n ":: Are you sure you want to proceed? [y/N] " && read ans && [ $${ans:-N} = y ]

get-account-ids: clean
	@cat main.tf-template | sed s/%TEAM_ACCOUNT_NUMBER%/temp/g > main.tf
	@terraform init
	@terraform apply -target null_resource.team_account_ids -auto-approve
	@terraform output -json team_account_ids | jq -r '.[]' > team_account_ids.txt

check-account-set:
	@if [ -z $(account) ]; then echo "\033[0;31m>> No account var set\033[0m"; exit 1; fi

set-main-template:
	@cat main.tf-template | sed s/%TEAM_ACCOUNT_NUMBER%/$(account)/g > main.tf

prep-environment:
	@$(call .clean)
	@terraform init

apply-all: get-account-ids
	for account_id in $$(cat team_account_ids.txt); do \
		cat main.tf-template | sed s/%TEAM_ACCOUNT_NUMBER%/$${account_id}/g > main.tf; \
		$(call .clean); \
		tfenv use && terraform init; \
		terraform apply -var team_account_number=$${account_id} -auto-approve; \
	done
	@$(call .clean-all)

destroy-all: confirm get-account-ids prep-environment
	for account_id in $$(cat team_account_ids.txt); do \
		cat main.tf-template | sed s/%TEAM_ACCOUNT_NUMBER%/$${account_id}/g > main.tf; \
		$(call .clean); \
		tfenv use && terraform init; \
		terraform destroy -var team_account_number=$${account_id} -auto-approve; \
	done
	@$(call .clean-all)

plan-single: check-account-set set-main-template prep-environment
	terraform plan -var team_account_number=$(account) -out=$(account).tfplan

destroy-plan-single: check-account-set set-main-template prep-environment
	terraform plan -var team_account_number=$(account) -destroy -out=$(account).tfplan

apply-single: plan-single
	terraform apply -auto-approve $(account).tfplan
	@$(call .clean-all)

destroy-single: destroy-plan-single confirm
	terraform apply -destroy -auto-approve $(account).tfplan
	@$(call .clean-all)

.clean = rm -Rf .terraform *.tfplan
.clean-all = rm -Rf main.tf .terraform *.tfplan

clean:
	$(call .clean-all)
