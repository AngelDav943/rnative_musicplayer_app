import { createContext, Fragment, useContext, useEffect, useState } from "react"

interface PortalProps {
	children: React.ReactNode
	name: string
}

interface Element {
	name: string;
	component: React.ReactNode;
}

const PortalContext = createContext({
	addComponent: (element: Element) => { },
	removeComponent: (name: string) => { }
})

export function Portal({ children, name }: PortalProps) {
	const { addComponent, removeComponent } = useContext(PortalContext)

	useEffect(() => {
		addComponent({ name, component: children })
		return () => {
			removeComponent(name)
		}
	}, [children, name])

	return null
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
	const [components, setComponents] = useState<Record<string, React.ReactNode>>({});
	const addComponent = ({ name, component }: Element) => {
		setComponents(prev => ({
			...prev,
			[name]: component
		}))
	}

	const removeComponent = (name: string) => {
		setComponents(prevComponents => {
			const newComponents = { ...prevComponents };
			delete newComponents[name];
			return newComponents;
		});
	}

	return (
		<PortalContext.Provider value={{ addComponent, removeComponent }}>
			<Fragment>
				{children}
			</Fragment>
			<Fragment>
				{Object.entries(components).map(([name, Component]) => (
					Component
				))}
			</Fragment>

		</PortalContext.Provider>
	);
}