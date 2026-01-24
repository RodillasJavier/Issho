import { Link } from "react-router";

export const Navbar = () => {
    return (
        <nav>
            <div>
                <div>
                    <Link to="/">
                        Issho
                    </Link>

                    {/* Desktop Nav */}
                    <div>
                        <Link to='/'>Home</Link>
                        <Link to='/create'>Create</Link>
                        <Link to='/communities'>Communities</Link>
                        <Link to='/community/create'>Create Community</Link>
                    </div>

                    {/* Mobile Nav */}
                    <div>
                        <Link to='/'>Home</Link>
                        <Link to='/create'>Create</Link>
                        <Link to='/communities'>Communities</Link>
                        <Link to='/community/create'>Create Community</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}