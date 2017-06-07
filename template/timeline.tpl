<div class='panel_btns'>
	<div>
		<a class='btn img panel_btn timeline_reload icon-redo tooltip' tooltip='(i18n_0218)'></a>
		<a class='btn img panel_btn clear_notification icon-eraser tooltip' tooltip='(i18n_0390)'></a>
		<a class='btn img panel_btn instance_info icon-info tooltip' tooltip='(i18n_0014)'></a>
		{if $type=='peep'}
		<div class='instance_info_window'>
			<div>(i18n_0010): </span><span class='users'></div>
			<div>(i18n_0011): </span><span class='statuses'></div>
		</div>
		{/if}
	</div>
	<div class='streamctl'>
		<a class='stm_btn tooltip off' tooltip='(i18n_0388)'></a>
	</div>
	<div class='sctbl'>
		<a class='tooltip icon-arrow_up' tooltip='(i18n_0194)'></a>
		<a class='tooltip icon-arrow_down' tooltip='(i18n_0192)'></a>
	</div>
</div>
<div class='timeline_list'>
</div>
