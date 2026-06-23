confirm:
	@echo -n "\033[1m:: Are you sure you want to proceed? [y/N]\033[0m " && read ans && [ $${ans:-N} = y ]

check-account-set:
	@if [ -z $(account) ]; then echo "\033[0;31m>> No account var set\033[0m"; exit 1; fi

check-organization-set:
	@if [ -z $(organization_uuid) ]; then echo "\033[0;31m>> No organization_uuid var set\033[0m"; exit 1; fi

check-event-set:
	@if [ -z $(event_uuid) ]; then echo "\033[0;31m>> No event_uuid var set\033[0m"; exit 1; fi

check-vars-set: check-account-set check-organization-set check-event-set

set-main-template:
	@cat main.tf-template | sed s/%TEAM_ACCOUNT_NUMBER%/$(account)/g > main.tf

prep-environment:
	@$(call .clean)
	@terraform init

plan-single: check-vars-set set-main-template prep-environment
	terraform plan \
	-var team_account_number=$(account) \
	-var organization_uuid=$(organization_uuid) \
	-var event_uuid=$(event_uuid) \
	-out=$(account).tfplan

destroy-plan-single: check-vars-set set-main-template prep-environment
	terraform plan -destroy \
	-var team_account_number=$(account) \
	-var organization_uuid=$(organization_uuid) \
	-var event_uuid=$(event_uuid) \
	-out=$(account).tfplan

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
