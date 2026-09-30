(() => {
    "use strict";

    const API = "/api/v1/tasks";
    const state = { page: 0, size: 9, status: "", query: "", data: null };
    const labels = { NEW: "Новая", IN_PROGRESS: "В работе", DONE: "Готово" };
    const classNames = { NEW: "status-new", IN_PROGRESS: "status-progress", DONE: "status-done" };
    let searchTimer;

    const elements = {
        list: document.querySelector("#task-list"),
        empty: document.querySelector("#empty-state"),
        feedback: document.querySelector("#feedback"),
        summary: document.querySelector("#result-summary"),
        total: document.querySelector("#metric-total"),
        progress: document.querySelector("#metric-progress"),
        done: document.querySelector("#metric-done"),
        previous: document.querySelector("#previous-page"),
        next: document.querySelector("#next-page"),
        indicator: document.querySelector("#page-indicator"),
        search: document.querySelector("#task-search"),
        filter: document.querySelector("#status-filter"),
        dialog: document.querySelector("#task-dialog"),
        form: document.querySelector("#task-form"),
        taskId: document.querySelector("#task-id"),
        title: document.querySelector("#task-title"),
        description: document.querySelector("#task-description"),
        status: document.querySelector("#task-status"),
        statusField: document.querySelector("#status-field"),
        statusWarning: document.querySelector("#status-warning"),
        statusWarningMessage: document.querySelector("#status-warning-message"),
        createAsNew: document.querySelector("#create-as-new"),
        createWithSelectedStatus: document.querySelector("#create-with-selected-status"),
        backToTask: document.querySelector("#back-to-task"),
        dialogActions: document.querySelector("#task-form > .dialog-actions"),
        kicker: document.querySelector("#dialog-kicker"),
        dialogTitle: document.querySelector("#dialog-title"),
        save: document.querySelector("#save-task"),
        formError: document.querySelector("#form-error"),
        titleCount: document.querySelector("#title-count")
    };

    async function api(url, options = {}) {
        const response = await fetch(url, {
            headers: { "Accept": "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}) },
            ...options
        });
        if (response.status === 204) return null;
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.detail || body.message || "Не удалось выполнить запрос.");
        return body;
    }

    async function loadTasks() {
        setBusy(true);
        hideFeedback();
        const params = new URLSearchParams({ page: String(state.page), size: String(state.size) });
        if (state.status) params.set("status", state.status);
        if (state.query) params.set("query", state.query);
        try {
            state.data = await api(`${API}?${params}`);
            render();
        } catch (error) {
            state.data = null;
            elements.list.replaceChildren();
            elements.empty.hidden = true;
            elements.summary.textContent = "Не удалось загрузить задачи";
            showFeedback(error.message);
            updatePagination();
        } finally {
            setBusy(false);
        }
    }

    function render() {
        const { content, totalElements } = state.data;
        elements.list.replaceChildren(...content.map(createTaskCard));
        elements.empty.hidden = content.length > 0;
        elements.list.hidden = content.length === 0;
        elements.summary.textContent = totalElements === 0
            ? "Задач по этому запросу нет"
            : `Найдено: ${plural(totalElements, "задача", "задачи", "задач")}`;
        elements.total.textContent = totalElements;
        elements.progress.textContent = content.filter(task => task.status === "IN_PROGRESS").length;
        elements.done.textContent = content.filter(task => task.status === "DONE").length;
        updatePagination();
    }

    function createTaskCard(task) {
        const card = document.createElement("article");
        card.className = "task-card";
        card.dataset.id = String(task.id);

        const top = document.createElement("div");
        top.className = "task-card-top";
        const id = document.createElement("span");
        id.className = "task-id";
        id.textContent = `#${task.id}`;
        const status = document.createElement("span");
        status.className = `status-pill ${classNames[task.status]}`;
        status.textContent = labels[task.status];
        top.append(id, status);

        const title = document.createElement("h3");
        title.className = "task-title";
        title.textContent = task.title;
        const description = document.createElement("p");
        description.className = "task-description";
        description.textContent = task.description || "Описание не добавлено";
        if (!task.description) description.classList.add("empty-description");

        const footer = document.createElement("div");
        footer.className = "task-card-footer";
        const date = document.createElement("time");
        date.className = "task-date";
        date.dateTime = task.createdAt;
        date.textContent = formatDate(task.createdAt);
        const actions = document.createElement("div");
        actions.className = "card-actions";
        actions.append(actionButton("edit", "Изменить"), actionButton("delete", "Удалить", true));
        footer.append(date, actions);
        card.append(top, title, description, footer);
        return card;
    }

    function actionButton(action, text, isDelete = false) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `card-button${isDelete ? " delete" : ""}`;
        button.dataset.action = action;
        button.textContent = text;
        return button;
    }

    function updatePagination() {
        const data = state.data;
        elements.previous.disabled = !data || state.page === 0;
        elements.next.disabled = !data || !data.hasNext;
        elements.indicator.textContent = data && data.totalPages > 0
            ? `Страница ${data.page + 1} из ${data.totalPages}`
            : "Страница —";
    }

    function openCreate() {
        elements.form.reset();
        elements.taskId.value = "";
        elements.kicker.textContent = "Новая задача";
        elements.dialogTitle.textContent = "Сфокусируйтесь на важном";
        elements.save.textContent = "Создать задачу";
        elements.statusField.hidden = false;
        hideStatusWarning();
        clearFormError();
        updateTitleCount();
        elements.dialog.showModal();
        elements.title.focus();
    }

    function openEdit(id) {
        const task = state.data?.content.find(item => item.id === id);
        if (!task) return;
        elements.taskId.value = String(task.id);
        elements.title.value = task.title;
        elements.description.value = task.description || "";
        elements.status.value = task.status;
        elements.kicker.textContent = `Задача #${task.id}`;
        elements.dialogTitle.textContent = "Обновить задачу";
        elements.save.textContent = "Сохранить изменения";
        elements.statusField.hidden = false;
        hideStatusWarning();
        clearFormError();
        updateTitleCount();
        elements.dialog.showModal();
        elements.title.focus();
    }

    async function saveTask(event) {
        event.preventDefault();
        clearFormError();
        if (!elements.form.reportValidity()) return;
        const editingId = elements.taskId.value;
        if (!editingId && elements.status.value !== "NEW") {
            showStatusWarning();
            return;
        }
        await submitTask(editingId, editingId ? elements.status.value : "NEW");
    }

    async function submitTask(editingId, createStatus) {
        const payload = { title: elements.title.value.trim(), description: elements.description.value.trim() || null };
        if (editingId) payload.status = elements.status.value;
        else payload.status = createStatus;

        elements.save.disabled = true;
        elements.createAsNew.disabled = true;
        elements.createWithSelectedStatus.disabled = true;
        elements.backToTask.disabled = true;
        elements.save.textContent = editingId ? "Сохраняем…" : "Создаём…";
        try {
            await api(editingId ? `${API}/${editingId}` : API, {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            hideStatusWarning();
            elements.dialog.close();
            announce(editingId ? "Задача обновлена." : "Задача создана.");
            await loadTasks();
        } catch (error) {
            elements.formError.textContent = error.message;
            elements.formError.hidden = false;
        } finally {
            elements.save.disabled = false;
            elements.createAsNew.disabled = false;
            elements.createWithSelectedStatus.disabled = false;
            elements.backToTask.disabled = false;
            elements.save.textContent = editingId ? "Сохранить изменения" : "Создать задачу";
        }
    }

    function showStatusWarning() {
        const selectedStatus = elements.status.value;
        elements.statusWarningMessage.textContent =
            `Эта задача ещё не добавлена в список, поэтому статус «${labels[selectedStatus]}» может ей не соответствовать.`;
        elements.createWithSelectedStatus.textContent = `Создать как «${labels[selectedStatus]}»`;
        elements.statusWarning.hidden = false;
        elements.dialogActions.hidden = true;
        elements.createAsNew.focus();
    }

    function hideStatusWarning() {
        elements.statusWarning.hidden = true;
        elements.dialogActions.hidden = false;
    }

    async function deleteTask(id) {
        const task = state.data?.content.find(item => item.id === id);
        if (!task || !window.confirm(`Удалить задачу «${task.title}»?`)) return;
        try {
            await api(`${API}/${id}`, { method: "DELETE" });
            if (state.data.content.length === 1 && state.page > 0) state.page -= 1;
            announce("Задача удалена.");
            await loadTasks();
        } catch (error) {
            showFeedback(error.message);
        }
    }

    function setBusy(isBusy) { elements.list.setAttribute("aria-busy", String(isBusy)); }
    function showFeedback(message) { elements.feedback.textContent = message; elements.feedback.dataset.kind = "error"; elements.feedback.hidden = false; }
    function hideFeedback() { elements.feedback.hidden = true; delete elements.feedback.dataset.kind; }
    function announce(message) { elements.feedback.textContent = message; elements.feedback.dataset.kind = "success"; elements.feedback.hidden = false; window.setTimeout(hideFeedback, 3200); }
    function clearFormError() { elements.formError.hidden = true; elements.formError.textContent = ""; }
    function updateTitleCount() { elements.titleCount.textContent = elements.title.value.length; }
    function formatDate(value) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
    function plural(value, one, few, many) { const mod10 = value % 10; const mod100 = value % 100; const word = mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? few : many; return `${value} ${word}`; }

    document.querySelector("#create-task").addEventListener("click", openCreate);
    document.querySelector("#empty-state [data-action='create']").addEventListener("click", openCreate);
    document.querySelector("#close-dialog").addEventListener("click", () => elements.dialog.close());
    document.querySelector("#cancel-dialog").addEventListener("click", () => elements.dialog.close());
    elements.form.addEventListener("submit", saveTask);
    elements.status.addEventListener("change", () => {
        const editingId = elements.taskId.value;
        if (!editingId && elements.status.value !== "NEW") {
            showStatusWarning();
        } else {
            hideStatusWarning();
        }
    });
    elements.createWithSelectedStatus.addEventListener("click", () => {
        if (elements.form.reportValidity()) submitTask("", elements.status.value);
    });
    elements.createAsNew.addEventListener("click", () => {
        if (elements.form.reportValidity()) submitTask("", "NEW");
    });
    elements.backToTask.addEventListener("click", hideStatusWarning);
    elements.title.addEventListener("input", updateTitleCount);
    elements.filter.addEventListener("change", () => { state.status = elements.filter.value; state.page = 0; loadTasks(); });
    elements.search.addEventListener("input", () => {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => { state.query = elements.search.value.trim(); state.page = 0; loadTasks(); }, 280);
    });
    elements.previous.addEventListener("click", () => { if (state.page > 0) { state.page -= 1; loadTasks(); } });
    elements.next.addEventListener("click", () => { if (state.data?.hasNext) { state.page += 1; loadTasks(); } });
    elements.list.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const id = Number(button.closest(".task-card")?.dataset.id);
        if (!Number.isSafeInteger(id)) return;
        if (button.dataset.action === "edit") openEdit(id);
        if (button.dataset.action === "delete") deleteTask(id);
    });
    elements.dialog.addEventListener("click", event => { if (event.target === elements.dialog) elements.dialog.close(); });

    loadTasks();
})();
