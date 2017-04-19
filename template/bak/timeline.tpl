<div class='panel_btns'>
	<div>
		{if $type!='group'}
		<a class='btn img panel_btn timeline_reload icon-redo tooltip' tooltip='(i18n_0218)'></a>
		{else}
		<a class='btn panel_btn timeline_clear'>(i18n_0060)</a>
		{/if}

		{if $type=='dmrecv'}
		<a class='btn panel_btn timeline_dmsent'>(i18n_0251)</a>
		{/if}
		{if $type=='search'}
		<a class='btn img panel_btn search_btns_btn icon-search'></a>
		<div class='search_btns'>
			<input type='text' class='searchagain_text' maxlength='140'>
			<a class='btn img timeline_searchagain icon-search tooltip' tooltip='(i18n_0206)'></a>
			<a class='btn disabled timeline_savesearch'>(i18n_0208)</a>
		</div>
		{/if}
	</div>
	<div class='ustbl'>
		<span class='streamuse icon-forward'></span>
	</div>
	<div class='sctbl'>
		<a class='tooltip icon-arrow_up' tooltip='(i18n_0194)'></a>
		<a class='tooltip icon-arrow_down' tooltip='(i18n_0192)'></a>
	</div>
</div>
<div class='timeline_list'>
</div>
