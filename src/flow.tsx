const execute = async () => {
  if (!flow.nodes.length) return;

  setRunning(true);
  setLog([]);

  let data: any = null;
  let local = { ...vars };
  let current: Node | undefined = flow.nodes[0];
  const visited = new Set<string>();

  try {
    while (current && !visited.has(current.id)) {
      visited.add(current.id);

      sync({
        ...flow,
        nodes: flow.nodes.map((n) =>
          n.id === current!.id ? { ...n, status: 'running' } : n
        ),
      });

      let value: any = data;

      if (current.kind === 'http') {
        const url = resolve(current.path, local);

        const response = await fetch('/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            method: current.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body:
              current.method === 'GET'
                ? undefined
                : resolve(current.body || '', local),
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.error || `HTTP ${response.status}`
          );
        }

        value = responseData.body
          ? (() => {
              try {
                return JSON.parse(responseData.body);
              } catch {
                return responseData.body;
              }
            })()
          : responseData;

        local.status = responseData.status;
        local.response = value;
      } else if (current.kind === 'condition') {
        const ok = current.condition
          ? Function(
              'v',
              'with(v){return ' +
                resolve(current.condition, local) +
                '}'
            )(local)
          : true;

        if (!ok) {
          setLog((x) => [
            ...x,
            `Condition failed: ${current.condition}`,
          ]);
          break;
        }

        value = local;
      } else if (current.kind === 'transform') {
        value = resolve(current.expression || 'value', local);
        local.value = value;
      } else if (current.kind === 'delay') {
        await new Promise((r) =>
          setTimeout(r, Math.min(current?.delay || 1000, 10000))
        );

        value = local;
      } else if (current.kind === 'script') {
        value = local;
      } else if (current.kind === 'connector') {
        value = {
          connector: current.connector,
          operation: current.operation,
          status: 'ready',
        };

        local.connectorResult = value;
      } else {
        value = local;
      }

      if (current.capture) {
        local[current.capture] =
          typeof value === 'string'
            ? value
            : JSON.stringify(value);
      }

      setVars({ ...local });

      sync({
        ...flow,
        nodes: flow.nodes.map((n) =>
          n.id === current!.id
            ? {
                ...n,
                status: 'success',
                value,
              }
            : n
        ),
      });

      setLog((x) => [
        ...x,
        `${current.kind.toUpperCase()} • ${current.name} • success${
          current.capture
            ? ` • {{${current.capture}}} captured`
            : ''
        }`,
      ]);

      const next = flow.edges.find(
        (e) =>
          e.from === current!.id &&
          !visited.has(e.to)
      );

      current = flow.nodes.find(
        (n) => n.id === next?.to
      );
    }
  } catch (e) {
    const msg = String(
      (e as Error).message || e
    );

    sync({
      ...flow,
      nodes: flow.nodes.map((n) =>
        n.id === current?.id
          ? {
              ...n,
              status: 'error',
              value: msg,
            }
          : n
      ),
    });

    setLog((x) => [
      ...x,
      `ERROR • ${msg}`,
    ]);
  } finally {
    setRunning(false);
  }
};
