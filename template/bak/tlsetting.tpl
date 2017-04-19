<div class='panel_btns'>
	<div>
		<a class='btn panel_btn tlsetting_apply'>(i18n_0255)</a>
	</div>
</div>
<div class='tlsetting_items'>
	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0093)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' class='set_notify_new' {if $param->notify_new==1}checked{/if}></span>
				<span>(i18n_0238)</span>
			</div>
		</div>
	</div>

	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0077)</div>
	<div class='kinditems'>
		{if $param->timeline_type!='group'}
		<div class='group'>
			<div class='title'>
				(i18n_0240)
			</div>
			<div class='slidercontainer'>
				<span class='slidestr'></span>
				<span class='set_reload_time'></span>
				<span class='slidestr'></span>
				<span class='value_disp'>{$param->reload_time}(i18n_0270)</span>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0191)
			</div>
			<div class='slidercontainer'>
				<span class='slidestr'></span>
				<span class='set_get_count'></span>
				<span class='slidestr'></span>
				<span class='value_disp'>{$param->get_count}(i18n_0204)</span>
			</div>
		</div>
		{/if}
		<div class='group'>
			<div class='title'>
				(i18n_0078)
			</div>
			<div class='slidercontainer'>
				<span class='slidestr'></span>
				<span class='set_max_count'></span>
				<span class='slidestr'></span>
				<span class='value_disp'>{$param->max_count}(i18n_0204)</span>
			</div>
		</div>
		{if $param->timeline_type=='search'}
		<div class='group'>
			<div class='title'>
				(i18n_0301)
			</div>
			<div class='radiocontainer'>
				<div><input type='radio' class='set_search_lang' name='search_lang_{$uniqueID}' value='0' {if $param->search_lang==0}checked{/if}>(i18n_0302)</div>
				<div><input type='radio' class='set_search_lang' name='search_lang_{$uniqueID}' value='1' {if $param->search_lang==1}checked{/if}>(i18n_0303)</div>
			</div>
		</div>
		{/if}
	</div>
	{if $param->timeline_type=='group'}
	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0063)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='textboxcontainer'>
				<span>(i18n_0075)</span>
				<span><input type='text' class='set_title' value='{$param->title}' maxlength='40'></span>
			</div>
		</div>
		<div class='group'>
			<div class='accsel'>
				(i18n_0044)
			</div>
			<div class='acclist'>
			</div>
		</div>
		<div class='group'>
			<div class='member'>
				<div>
					(i18n_0156)
				</div>
				<div>
					<span class='memcnt'></span>/300
				</div>
			</div>
			<div class='member_list'>
			</div>
		</div>
	</div>
	{/if}
</div>
