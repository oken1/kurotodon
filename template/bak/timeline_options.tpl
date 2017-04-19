				{if $type=='dmrecv' || $type=='dmsent'}
					<span class='btns timeline_menu icon-arrow_down tooltip' tooltip='(i18n_0155)'></span>
					<span class='btns timeline_del icon-remove tooltip' tooltip='(i18n_0223)'></span>
					{if $type=='dmrecv'}
					<span class='btns timeline_reply icon-undo tooltip' tooltip='(i18n_0274)'></span>
					{/if}
				{else}
					<span class='btns timeline_menu icon-arrow_down tooltip' tooltip='(i18n_0155)'></span>
					{if $mytweet}
					<span class='btns timeline_del icon-remove tooltip' tooltip='(i18n_0223)'></span>
					{/if}
					{if !$protected}
					<span class='btns timeline_retweet icon-loop tooltip' tooltip='(i18n_0314)'></span>
					{/if}
					<span class='btns timeline_reply icon-undo tooltip' tooltip='(i18n_0274)'></span>
					<div class='accsel'></div>
				{/if}
