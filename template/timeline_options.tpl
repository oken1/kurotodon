					<span class='btns timeline_menu icon-arrow_down tooltip' tooltip='(i18n_0155)'></span>
					{if $type!='peep'}
					{if $mytoot}
					<span class='btns timeline_del icon-remove tooltip' tooltip='(i18n_0223)'></span>
					{/if}
					{if $visibility!='private'&&$visibility!='direct'}
					<span class='btns timeline_boost icon-loop {if $reblogged==true}on{else}off{/if} tooltip' tooltip='(i18n_0314)'></span>
					{/if}
					<span class='btns timeline_reply icon-undo tooltip' tooltip='(i18n_0274)'></span>
					{/if}
					