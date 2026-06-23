.DEFAULT_GOAL := do-nothing

do-nothing:
	@echo ":: Nothing to do"; exit 0

confirm:
	@echo -n "\033[1m:: Are you sure you want to proceed? [y/N]\033[0m " && read ans && [ $${ans:-N} = y ]

check-account-set:
	@if [ -z $(account) ]; then echo "\033[0;31m>> No account var set\033[0m"; exit 1; fi

check-account-name-set:
	@if [ -z $(account_name) ]; then echo "\033[0;31m>> No account_name var set\033[0m"; exit 1; fi

check-vars-set: check-account-set check-account-name-set

set-main-template:
	@cat main.tf-template | sed s/%TEAM_ACCOUNT_NUMBER%/$(account)/g > main.tf

prep-environment:
	@tfenv use
	@$(call .clean)
	@terraform init

plan-single: check-vars-set set-main-template prep-environment
	terraform plan \
		-var team_account_number=$(account) \
		-var team_account_name=$(account_name) \
		-out=$(account_name).tfplan

destroy-plan-single: check-vars-set set-main-template prep-environment
	terraform plan -destroy \
		-var team_account_number=$(account) \
		-var team_account_name=$(account_name) \
		-out=$(account_name).tfplan

apply-single: plan-single
	terraform apply -auto-approve $(account_name).tfplan
	@$(call .clean-all)

destroy-single: destroy-plan-single
	terraform apply -destroy -auto-approve $(account_name).tfplan
	@$(call .clean-all)

.clean = rm -Rf .terraform *.tfplan
.clean-all = rm -Rf main.tf .terraform *.tfplan

clean:
	$(call .clean-all)
