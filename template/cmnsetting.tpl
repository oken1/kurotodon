<div class='panel_btns'>
	<div>
		<a id='cmnsetting_apply' class='btn panel_btn'>(i18n_0255)</a>
	</div>
</div>
<div id='cmnsetting_items'>
	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0247)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='title'>
				(i18n_0389)
			</div>
			<div class='selectboxcontainer'>
				<select id='cset_locale'>
					<option value='en'>English</option>
					<option value='ja'>日本語</option>
				</select>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0136)
			</div>
			<div class='slidercontainer'>
				<span class='slidestr'></span>
				<span id='cset_font_size'></span>
				<span class='slidestr'></span>
				<span id='cset_font_size_disp' class='value_disp'>{$param->font_size}px</span>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0300)
			</div>
			<div class='textboxcontainer'>
				<input type='text' maxlength='64' id='cset_font_family' value='{$param->font_family}'>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0340)
			</div>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' id='cset_scroll_vertical' {if $param->scroll_vertical==1}checked{/if}></span>
				<span>(i18n_0341)</span>
			</div>
			<div class='checkboxcontainer'>
				<span><input type='checkbox' id='cset_scroll_horizontal' {if $param->scroll_horizontal==1}checked{/if}></span>
				<span>(i18n_0342)</span>
			</div>
		</div>
	</div>

	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0413)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='title'>
				(i18n_0414)
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0418)</span>
				<span><input type='text' value='{$param->color->panel->background}'></span>
				<span><input type='color' id='cset_color_panel_background' value='{$param->color->panel->background}'></span>
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0419)</span>
				<span><input type='text' value='{$param->color->panel->text}'></span>
				<span><input type='color' id='cset_color_panel_text' value='{$param->color->panel->text}'></span>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0415)
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0418)</span>
				<span><input type='text' value='{$param->color->toot->background}'></span>
				<span><input type='color' id='cset_color_toot_background' value='{$param->color->toot->background}'></span>
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0419)</span>
				<span><input type='text' value='{$param->color->toot->text}'></span>
				<span><input type='color' id='cset_color_toot_text' value='{$param->color->toot->text}'></span>
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0420)</span>
				<span><input type='text' value='{$param->color->toot->link}'></span>
				<span><input type='color' id='cset_color_toot_link' value='{$param->color->toot->link}'></span>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0416)
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0418)</span>
				<span><input type='text' value='{$param->color->titlebar->background}'></span>
				<span><input type='color' id='cset_color_titlebar_background' value='{$param->color->titlebar->background}'></span>
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0419)</span>
				<span><input type='text' value='{$param->color->titlebar->text}'></span>
				<span><input type='color' id='cset_color_titlebar_text' value='{$param->color->titlebar->text}'></span>
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0421)</span>
				<span><input type='text' value='{$param->color->titlebar->fixed}'></span>
				<span><input type='color' id='cset_color_titlebar_fixed' value='{$param->color->titlebar->fixed}'></span>
			</div>
		</div>
		<div class='group'>
			<div class='title'>
				(i18n_0417)
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0418)</span>
				<span><input type='text' value='{$param->color->button->background}'></span>
				<span><input type='color' id='cset_color_button_background' value='{$param->color->button->background}'></span>
			</div>
			<div class='colorcontainer'>
				<span>(i18n_0419)</span>
				<span><input type='text' value='{$param->color->button->text}'></span>
				<span><input type='color' id='cset_color_button_text' value='{$param->color->button->text}'></span>
			</div>
		</div>
	</div>
	
	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0093)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='title'>
				(i18n_0198)
			</div>
			<div class='slidercontainer'>
				<span><a class='btn tooltip' id='cset_audition' tooltip='(i18n_0226)'>♪</a></span>
				<span class='slidestr'></span>
				<span id='cset_notify_sound_volume'></span>
				<span class='slidestr'></span>
				<span id='cset_notify_sound_volume_disp' class='value_disp'>{$param->notify_sound_volume}</span>
			</div>
		</div>
	</div>

	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0367)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='title'>
				(i18n_0086)
			</div>
			<div class='radiocontainer'>
				<div><input type='radio' name='cset_tootkey' value='0' {if $param->tootkey==0}checked{/if}>Ctrl+Enter</div>
				<div><input type='radio' name='cset_tootkey' value='1' {if $param->tootkey==1}checked{/if}>Shift+Enter</div>
				<div><input type='radio' name='cset_tootkey' value='2' {if $param->tootkey==2}checked{/if}>Enter</div>
			</div>
		</div>
	</div>

	<div class='kind'><span class='icon-arrow_down'></span>(i18n_0309)</div>
	<div class='kinditems'>
		<div class='group'>
			<div class='title'>
				(i18n_0310)
			</div>
			<div class='textboxcontainer'>
				<input type='text' maxlength='140' id='cset_nowbrowsing_text' value='{$param->nowbrowsing_text}'>
			</div>
		</div>
	</div>
</div>
