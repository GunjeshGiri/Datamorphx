import argparse
from datamorphx.converter import DataMorphX

def main():
    parser = argparse.ArgumentParser(prog="datamorphx")
    parser.add_argument("input", help="Input file path")
    parser.add_argument("output", help="Output file path")
    parser.add_argument("--no-validate", dest="validate", action="store_false", help="Disable validation")
    args = parser.parse_args()

    dm = DataMorphX()
    res = dm.convert(args.input, args.output, validate=args.validate)
    print("Conversion result:", res)

if __name__ == "__main__":
    main()
